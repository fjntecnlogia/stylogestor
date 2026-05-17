import { Injectable, Logger } from '@nestjs/common'
import Stripe from 'stripe'

// IDs dos produtos no Stripe (criados automaticamente na primeira execução)
// Guarde esses IDs como variáveis de ambiente após criação
const PLANOS = {
  STARTER: {
    name: 'STYLOGESTOR Starter',
    price: 7900, // R$ 79,00 em centavos
    priceAnual: 79000, // R$ 790,00
    description: '1 profissional · Agenda + Clientes',
  },
  PRO: {
    name: 'STYLOGESTOR Pro',
    price: 14900,
    priceAnual: 149000,
    description: 'Até 5 profissionais · Financeiro + WhatsApp',
  },
  PREMIUM: {
    name: 'STYLOGESTOR Premium',
    price: 24900,
    priceAnual: 249000,
    description: 'Profissionais ilimitados · Tudo incluso',
  },
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name)
  private stripe: Stripe

  constructor() {
    // Não pinamos apiVersion (`undefined`) — usa a default da conta no Stripe.
    // O cliente da v22 espera `'2026-04-22.dahlia'`, mas a conta pode estar em
    // versão anterior. Deixar indefinido evita o lock-in.
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')
  }

  // ── Criar sessão de checkout ──────────────────────────────────
  async createCheckoutSession(params: {
    tenantId: string
    tenantName: string
    email: string
    plan: 'STARTER' | 'PRO' | 'PREMIUM'
    ciclo: 'mensal' | 'anual'
    successUrl: string
    cancelUrl: string
  }) {
    const plano = PLANOS[params.plan]
    const valor = params.ciclo === 'anual' ? plano.priceAnual : plano.price
    const intervalo = params.ciclo === 'anual' ? 'year' : 'month'

    // Busca ou cria customer no Stripe
    let customer: Stripe.Customer
    const existingCustomers = await this.stripe.customers.search({
      query: `metadata['tenantId']:'${params.tenantId}'`,
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await this.stripe.customers.create({
        email: params.email,
        name: params.tenantName,
        metadata: { tenantId: params.tenantId },
        preferred_locales: ['pt-BR'],
      })
    }

    // Cria sessão de checkout
    const session = await this.stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      currency: 'brl',
      locale: 'pt-BR',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: plano.name,
              description: plano.description,
              metadata: { plan: params.plan },
            },
            unit_amount: valor,
            recurring: { interval: intervalo },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14, // 14 dias grátis
        metadata: {
          tenantId: params.tenantId,
          plan: params.plan,
          ciclo: params.ciclo,
        },
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        tenantId: params.tenantId,
        plan: params.plan,
      },
    })

    this.logger.log(`Checkout criado: ${session.id} | Tenant: ${params.tenantId} | Plano: ${params.plan}`)
    return { url: session.url, sessionId: session.id }
  }

  // ── Criar portal do cliente (gerenciar assinatura) ────────────
  async createBillingPortalSession(stripeCustomerId: string, returnUrl: string) {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    })
    return { url: session.url }
  }

  // ── Construir evento do webhook ───────────────────────────────
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    )
  }

  // ── Buscar assinatura ─────────────────────────────────────────
  async getSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.retrieve(subscriptionId)
  }

  // ── Cancelar assinatura ───────────────────────────────────────
  async cancelSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.cancel(subscriptionId)
  }
}
