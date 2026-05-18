import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import Stripe from 'stripe'
import { PrismaService } from '../../common/prisma/prisma.service'
import {
  getInvoiceTenantId,
  getPeriodEnd,
  getPeriodStart,
} from './stripe-compat'

const PLANOS = [
  {
    id: 'STARTER', name: 'Starter', price: 79, priceAnual: 790,
    profissionais: 1,
    recursos: ['Agenda completa', 'Agendamento online', 'Clientes ilimitados', 'Serviços e preços'],
  },
  {
    id: 'PRO', name: 'Pro', price: 149, priceAnual: 1490,
    profissionais: 5,
    destaque: true,
    recursos: ['WhatsApp automático', 'Módulo financeiro', 'Programa de fidelidade', 'Comissões automáticas', 'Relatórios'],
  },
  {
    id: 'PREMIUM', name: 'Premium', price: 249, priceAnual: 2490,
    profissionais: -1,
    recursos: ['Tudo do Pro', 'Controle de estoque', 'CRM avançado', 'Relatórios avançados', 'Exportação PDF/Excel', 'Suporte prioritário'],
  },
]

type Plan = 'STARTER' | 'PRO' | 'PREMIUM'
type SubStatus = 'active' | 'trial' | 'past_due' | 'canceled'

function isValidPlan(plan: string | undefined | null): plan is Plan {
  return plan === 'STARTER' || plan === 'PRO' || plan === 'PREMIUM'
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubStatus {
  if (status === 'active') return 'active'
  if (status === 'trialing') return 'trial'
  if (status === 'past_due' || status === 'unpaid') return 'past_due'
  return 'canceled'
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name)

  constructor(private prisma: PrismaService) {}

  getPlans() {
    return PLANOS
  }

  getCurrent(tenantId: string) {
    return this.prisma.subscription.findUnique({ where: { tenantId } })
  }

  // ── Handler principal de eventos Stripe ──────────────────────
  // Idempotência: a checagem por event.id é feita no controller ANTES de chamar
  // este método. Aqui dentro, todas as operações multi-tabela usam $transaction.
  async handleStripeEvent(event: Stripe.Event) {
    this.logger.log(`Stripe event: ${event.type} (${event.id})`)

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        this.logger.log(`Evento não tratado: ${event.type}`)
    }
  }

  // ── Checkout concluído (usuário pagou) ───────────────────────
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const tenantId = session.metadata?.tenantId
    const plan = session.metadata?.plan
    if (!tenantId || !isValidPlan(plan)) {
      // Eventos sem `tenantId` vêm do checkout do Next.js (apps/web), que usa
      // o formato { userId, planId } em vez de { tenantId, plan }. Esses são
      // processados pelo handler do Next em /api/webhooks/stripe.
      // Aqui só ignoramos silenciosamente — webhook_events já gravou idempotência.
      // TODO Fase 2: adicionar lookup userId→tenant e processar também aqui.
      this.logger.debug(`checkout.session.completed ignorado (sem tenantId): ${session.id}`)
      return
    }

    const stripeCustomerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id || ''

    const stripeSubId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id || ''

    // Multi-tabela atômico: ou os 2 ou nenhum
    await this.prisma.$transaction([
      this.prisma.subscription.upsert({
        where: { tenantId },
        create: {
          tenantId,
          plan,
          status: 'active',
          stripeSubId,
          stripeCustomerId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          plan,
          status: 'active',
          stripeSubId,
          stripeCustomerId,
        },
      }),
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { plan },
      }),
    ])

    this.logger.log(`✅ Assinatura ativada: Tenant ${tenantId} → Plano ${plan}`)
  }

  // ── Assinatura atualizada (renovação, upgrade, downgrade) ────
  private async handleSubscriptionUpdated(sub: Stripe.Subscription) {
    const tenantId = sub.metadata?.tenantId
    if (!tenantId) {
      // Mesma situação do checkout: vem do Next.js sem tenantId.
      this.logger.debug(`subscription.updated ignorado (sem tenantId): ${sub.id}`)
      return
    }

    const plan = sub.metadata?.plan
    if (!isValidPlan(plan)) {
      // Sem default silencioso. Se vier vazio/quebrado quando TEM tenantId,
      // alerta — billing não pode promover/rebaixar tenant por engano.
      this.logger.error(
        `subscription.updated com plan inválido para tenant ${tenantId}: '${plan}'. Abortando.`,
      )
      throw new BadRequestException(`Plano inválido em metadata: ${plan}`)
    }

    const status = mapStripeStatus(sub.status)

    const periodStart = new Date(getPeriodStart(sub) * 1000)
    const periodEnd = new Date(getPeriodEnd(sub) * 1000)

    const subscriptionWrite = this.prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId, plan, status,
        stripeSubId: sub.id,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
      update: {
        status,
        plan,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    })

    if (status === 'active') {
      await this.prisma.$transaction([
        subscriptionWrite,
        this.prisma.tenant.update({ where: { id: tenantId }, data: { plan } }),
      ])
    } else {
      await subscriptionWrite
    }
  }

  // ── Assinatura cancelada ─────────────────────────────────────
  private async handleSubscriptionCanceled(sub: Stripe.Subscription) {
    const tenantId = sub.metadata?.tenantId
    if (!tenantId) return

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { tenantId },
        data: { status: 'canceled', canceledAt: new Date() },
      }),
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { plan: 'FREE' },
      }),
    ])

    this.logger.log(`❌ Assinatura cancelada: Tenant ${tenantId}`)
  }

  // ── Pagamento confirmado ─────────────────────────────────────
  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const tenantId = getInvoiceTenantId(invoice)
    if (!tenantId) return

    this.logger.log(
      `💰 Pagamento confirmado: R$ ${(invoice.amount_paid / 100).toFixed(2)} | Tenant ${tenantId}`,
    )
  }

  // ── Pagamento falhou ─────────────────────────────────────────
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const tenantId = getInvoiceTenantId(invoice)
    if (!tenantId) return

    // Sem .catch silencioso — se o update falhar, propaga e o webhook devolve 500
    // (Stripe re-tenta). Ficar `active` localmente quando Stripe diz `past_due` é
    // bypass de billing — NUNCA engolir.
    await this.prisma.subscription.update({
      where: { tenantId },
      data: { status: 'past_due' },
    })

    this.logger.warn(`⚠️ Pagamento falhou: Tenant ${tenantId}`)
  }
}
