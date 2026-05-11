import { Injectable, Logger } from '@nestjs/common'
import Stripe from 'stripe'
import { PrismaService } from '../../common/prisma/prisma.service'

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
  async handleStripeEvent(event: Stripe.Event) {
    this.logger.log(`Stripe event: ${event.type}`)

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
    const plan = session.metadata?.plan as 'STARTER' | 'PRO' | 'PREMIUM'

    if (!tenantId || !plan) return

    const stripeCustomerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id || ''

    const stripeSubId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id || ''

    await this.prisma.subscription.upsert({
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
    })

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { plan },
    })

    this.logger.log(`✅ Assinatura ativada: Tenant ${tenantId} → Plano ${plan}`)
  }

  // ── Assinatura atualizada (renovação, upgrade, downgrade) ────
  private async handleSubscriptionUpdated(sub: Stripe.Subscription) {
    const tenantId = sub.metadata?.tenantId
    if (!tenantId) return

    const plan = (sub.metadata?.plan as 'STARTER' | 'PRO' | 'PREMIUM') || 'PRO'
    const status = sub.status === 'active' ? 'active'
      : sub.status === 'trialing' ? 'trial'
      : sub.status === 'past_due' ? 'past_due'
      : 'canceled'

    await this.prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId, plan, status,
        stripeSubId: sub.id,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      },
      update: {
        status,
        plan,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      },
    })

    if (status === 'active') {
      await this.prisma.tenant.update({ where: { id: tenantId }, data: { plan } })
    }
  }

  // ── Assinatura cancelada ─────────────────────────────────────
  private async handleSubscriptionCanceled(sub: Stripe.Subscription) {
    const tenantId = sub.metadata?.tenantId
    if (!tenantId) return

    await this.prisma.subscription.update({
      where: { tenantId },
      data: { status: 'canceled', canceledAt: new Date() },
    })

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: 'FREE' },
    })

    this.logger.log(`❌ Assinatura cancelada: Tenant ${tenantId}`)
  }

  // ── Pagamento confirmado (registra fatura) ───────────────────
  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const tenantId = invoice.subscription_details?.metadata?.tenantId
    if (!tenantId) return

    this.logger.log(`💰 Pagamento confirmado: R$ ${(invoice.amount_paid / 100).toFixed(2)} | Tenant ${tenantId}`)
  }

  // ── Pagamento falhou ─────────────────────────────────────────
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const tenantId = invoice.subscription_details?.metadata?.tenantId
    if (!tenantId) return

    await this.prisma.subscription.update({
      where: { tenantId },
      data: { status: 'past_due' },
    }).catch(() => null)

    this.logger.warn(`⚠️ Pagamento falhou: Tenant ${tenantId}`)
  }
}
