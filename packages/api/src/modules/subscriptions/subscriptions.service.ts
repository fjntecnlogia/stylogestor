import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import Stripe from 'stripe'
import { ClerkMetadataService } from '../../common/clerk/clerk-metadata.service'
import { SupabaseMetadataService } from '../../common/auth/supabase-metadata.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { EmailService } from '../notifications/email.service'
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

/**
 * Resolução de identidade a partir do metadata do Stripe.
 *
 * O Next.js (apps/web) cria checkouts com metadata { userId (clerkId), planId, tenantSlug }.
 * A API NestJS cria checkouts com metadata { tenantId, plan, ciclo }.
 *
 * Pra dar suporte aos dois formatos (Fase 2A — dual write), normalizamos
 * pra { tenantId, plan, clerkUserId? } a partir do que veio.
 */
interface NormalizedMetadata {
  tenantId: string
  plan: Plan
  clerkUserId?: string
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkMetadata: ClerkMetadataService,
    private readonly supabaseMetadata: SupabaseMetadataService,
    private readonly email: EmailService,
  ) {}

  /**
   * Dual-write da assinatura no `app_metadata` do Supabase (além do Clerk), pro
   * middleware do web ler o status do JWT durante e depois do cutover da Fase 3.
   * Resolve o owner do tenant → supabaseId. No-op se service_role ausente ou se
   * o owner não tiver conta Supabase (ainda só-Clerk). Best-effort.
   */
  private async syncSupabaseSubscription(
    tenantId: string,
    payload: { subscriptionStatus: string; plan?: string; stripeSubId?: string },
  ) {
    if (!this.supabaseMetadata.enabled) return
    const owner = await this.prisma.tenantUser.findFirst({
      where: { tenantId, active: true, role: 'owner' },
      include: { user: { select: { supabaseId: true } } },
    })
    await this.supabaseMetadata.updateSubscription(owner?.user?.supabaseId, payload)
  }

  getPlans() {
    return PLANOS
  }

  getCurrent(tenantId: string) {
    return this.prisma.subscription.findUnique({ where: { tenantId } })
  }

  /**
   * Normaliza metadata do Stripe (suporta os 2 formatos: NestJS e Next.js).
   * Faz lookup clerkUserId → tenantId via User + TenantUser quando necessário.
   * Retorna null se não conseguir resolver (ex: usuário sem tenant ativo).
   */
  private async normalizeMetadata(
    md: Record<string, string> | null | undefined,
  ): Promise<NormalizedMetadata | null> {
    if (!md) return null

    // Formato NestJS: { tenantId, plan }
    if (md.tenantId && isValidPlan(md.plan)) {
      return { tenantId: md.tenantId, plan: md.plan }
    }

    // Formato Next.js: { userId (clerkId), planId }
    const clerkUserId = md.userId
    const plan = md.planId
    if (!clerkUserId || !isValidPlan(plan)) return null

    // Lookup: clerkUserId → user → primeiro tenant ativo
    const user = await this.prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      include: {
        tenants: {
          where: { active: true },
          select: { tenantId: true },
          take: 1,
        },
      },
    })

    if (!user || user.tenants.length === 0) {
      this.logger.warn(
        `Lookup clerkUserId→tenant falhou: clerkId=${clerkUserId} (user sem tenant ativo)`,
      )
      return null
    }

    return {
      tenantId: user.tenants[0].tenantId,
      plan,
      clerkUserId,
    }
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
    const md = await this.normalizeMetadata(session.metadata as Record<string, string> | null)
    if (!md) {
      this.logger.debug(`checkout.session.completed ignorado (sem metadata válido): ${session.id}`)
      return
    }

    const stripeCustomerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id || ''

    const stripeSubId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id || ''

    // 1. Multi-tabela atômico no DB
    await this.prisma.$transaction([
      this.prisma.subscription.upsert({
        where: { tenantId: md.tenantId },
        create: {
          tenantId: md.tenantId,
          plan: md.plan,
          status: 'active',
          stripeSubId,
          stripeCustomerId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          plan: md.plan,
          status: 'active',
          stripeSubId,
          stripeCustomerId,
        },
      }),
      this.prisma.tenant.update({
        where: { id: md.tenantId },
        data: { plan: md.plan },
      }),
    ])

    this.logger.log(`✅ Assinatura ativada: Tenant ${md.tenantId} → Plano ${md.plan}`)

    // 2. Sync Clerk metadata (não bloqueia se falhar)
    if (md.clerkUserId) {
      await this.clerkMetadata.updateSubscription(md.clerkUserId, {
        subscriptionStatus: 'active',
        plan: md.plan,
        stripeSubId,
      })
    }
    // 2b. Dual-write Supabase app_metadata (middleware do web pós-Fase 3)
    await this.syncSupabaseSubscription(md.tenantId, {
      subscriptionStatus: 'active',
      plan: md.plan,
      stripeSubId,
    })

    // 3. Email de boas-vindas (best-effort)
    const customerEmail = session.customer_details?.email
    const customerName = session.customer_details?.name
    if (customerEmail && customerName) {
      await this.email.sendWelcome(customerEmail, customerName)
    }
  }

  // ── Assinatura atualizada (renovação, upgrade, downgrade) ────
  private async handleSubscriptionUpdated(sub: Stripe.Subscription) {
    const md = await this.normalizeMetadata(sub.metadata as Record<string, string> | null)
    if (!md) {
      this.logger.debug(`subscription.updated ignorado (sem metadata válido): ${sub.id}`)
      return
    }

    const status = mapStripeStatus(sub.status)
    const periodStart = new Date(getPeriodStart(sub) * 1000)
    const periodEnd = new Date(getPeriodEnd(sub) * 1000)

    const subscriptionWrite = this.prisma.subscription.upsert({
      where: { tenantId: md.tenantId },
      create: {
        tenantId: md.tenantId,
        plan: md.plan,
        status,
        stripeSubId: sub.id,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
      update: {
        status,
        plan: md.plan,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    })

    if (status === 'active') {
      await this.prisma.$transaction([
        subscriptionWrite,
        this.prisma.tenant.update({ where: { id: md.tenantId }, data: { plan: md.plan } }),
      ])
    } else {
      await subscriptionWrite
    }

    // Sync Clerk metadata pra middleware Next ver o status novo
    if (md.clerkUserId) {
      await this.clerkMetadata.updateSubscription(md.clerkUserId, {
        subscriptionStatus: status,
        plan: md.plan,
        stripeSubId: sub.id,
      })
    }
    // Dual-write Supabase app_metadata
    await this.syncSupabaseSubscription(md.tenantId, {
      subscriptionStatus: status,
      plan: md.plan,
      stripeSubId: sub.id,
    })
  }

  // ── Assinatura cancelada ─────────────────────────────────────
  private async handleSubscriptionCanceled(sub: Stripe.Subscription) {
    const md = await this.normalizeMetadata(sub.metadata as Record<string, string> | null)
    if (!md) return

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { tenantId: md.tenantId },
        data: { status: 'canceled', canceledAt: new Date() },
      }),
      this.prisma.tenant.update({
        where: { id: md.tenantId },
        data: { plan: 'FREE' },
      }),
    ])

    this.logger.log(`❌ Assinatura cancelada: Tenant ${md.tenantId}`)

    // Sync Clerk → middleware Next bloqueia acesso
    if (md.clerkUserId) {
      await this.clerkMetadata.updateSubscription(md.clerkUserId, {
        subscriptionStatus: 'canceled',
      })
    }
    // Dual-write Supabase app_metadata
    await this.syncSupabaseSubscription(md.tenantId, { subscriptionStatus: 'canceled' })
  }

  // ── Pagamento confirmado ─────────────────────────────────────
  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const tenantId = getInvoiceTenantId(invoice)
    if (!tenantId) return

    this.logger.log(
      `💰 Pagamento confirmado: R$ ${(invoice.amount_paid / 100).toFixed(2)} | Tenant ${tenantId}`,
    )

    // Sync Clerk: ativa status (caso estivesse past_due antes)
    // Aqui só temos tenantId via invoice metadata. Pra atualizar Clerk
    // precisamos achar o user. Vai pelo TenantUser primeiro (owner).
    const owner = await this.prisma.tenantUser.findFirst({
      where: { tenantId, active: true, role: 'owner' },
      include: { user: { select: { clerkId: true } } },
    })
    if (owner?.user?.clerkId) {
      await this.clerkMetadata.updateSubscription(owner.user.clerkId, {
        subscriptionStatus: 'active',
      })
    }
    // Dual-write Supabase app_metadata
    await this.syncSupabaseSubscription(tenantId, { subscriptionStatus: 'active' })
  }

  // ── Pagamento falhou ─────────────────────────────────────────
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const tenantId = getInvoiceTenantId(invoice)
    if (!tenantId) return

    await this.prisma.subscription.update({
      where: { tenantId },
      data: { status: 'past_due' },
    })

    this.logger.warn(`⚠️ Pagamento falhou: Tenant ${tenantId}`)

    // Sync Clerk + Email pro owner
    const owner = await this.prisma.tenantUser.findFirst({
      where: { tenantId, active: true, role: 'owner' },
      include: { user: { select: { clerkId: true, email: true, name: true } } },
    })

    if (owner?.user?.clerkId) {
      await this.clerkMetadata.updateSubscription(owner.user.clerkId, {
        subscriptionStatus: 'past_due',
      })
    }
    // Dual-write Supabase app_metadata
    await this.syncSupabaseSubscription(tenantId, { subscriptionStatus: 'past_due' })

    if (owner?.user?.email && owner.user.name) {
      const amount = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format((invoice.amount_due ?? 0) / 100)
      await this.email.sendPaymentFailed(owner.user.email, owner.user.name, amount)
    }
  }
}
