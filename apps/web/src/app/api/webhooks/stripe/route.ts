import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { clerkClient } from '@clerk/nextjs/server'
import { sendWelcomeEmail, sendPaymentFailedEmail } from '@/lib/resend'
import Stripe from 'stripe'

// ── Compat helpers: Stripe moveu campos entre versões da API ─────
// API antiga: sub.current_period_start/end e invoice.subscription
// API nova (basil/2025+): sub.items.data[0].current_period_start/end e invoice.parent.subscription_details.subscription
// O cliente Stripe nao pina apiVersion (getStripe), entao aceitamos os dois.
type SubWithLegacyPeriod = Stripe.Subscription & {
  current_period_start?: number
  current_period_end?: number
}
type InvoiceWithLegacySub = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null
}

function getPeriodStart(sub: Stripe.Subscription): number {
  const fromItem = sub.items?.data?.[0]?.current_period_start
  if (typeof fromItem === 'number') return fromItem
  return (sub as SubWithLegacyPeriod).current_period_start ?? 0
}

function getPeriodEnd(sub: Stripe.Subscription): number {
  const fromItem = sub.items?.data?.[0]?.current_period_end
  if (typeof fromItem === 'number') return fromItem
  return (sub as SubWithLegacyPeriod).current_period_end ?? 0
}

function getSubIdFromInvoice(invoice: Stripe.Invoice): string | undefined {
  // Nova API: invoice.parent.subscription_details.subscription
  const parent = invoice.parent
  if (parent && 'subscription_details' in parent) {
    const fromNew = parent.subscription_details?.subscription
    if (typeof fromNew === 'string') return fromNew
    if (fromNew && typeof fromNew === 'object' && 'id' in fromNew) return fromNew.id
  }
  // API antiga: invoice.subscription
  const legacy = (invoice as InvoiceWithLegacySub).subscription
  if (typeof legacy === 'string') return legacy
  if (legacy && typeof legacy === 'object' && 'id' in legacy) return legacy.id
  return undefined
}

// ── Atualiza metadata no Clerk ───────────────────────────────────
async function updateUserSubscription(
  userId: string,
  status: string,
  plan?: string,
  stripeSubId?: string,
) {
  try {
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        subscriptionStatus: status,
        ...(plan && { plan }),
        ...(stripeSubId && { stripeSubId }),
      },
    })
    console.log(`[CLERK_META] userId=${userId} status=${status} plan=${plan}`)
  } catch (err) {
    console.error('[CLERK_META_ERROR]', err)
  }
}

// ── Salva/atualiza no banco via API interna ──────────────────────
async function syncSubscriptionDB(params: {
  clerkUserId: string
  stripeSubId: string
  stripeCustomerId: string
  plan: string
  status: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  canceledAt?: Date
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const apiKey = process.env.INTERNAL_API_KEY || ''
  try {
    await fetch(`${apiUrl}/api/v1/subscriptions/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': apiKey,
      },
      body: JSON.stringify(params),
    })
  } catch (err) {
    // Não crítico — Clerk já foi atualizado
    console.error('[SYNC_DB_ERROR]', err)
  }
}

export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret não configurado' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[WEBHOOK_SIG_ERROR]', err)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  console.log(`[STRIPE_WEBHOOK] ${event.type}`)
  const stripe = getStripe()

  switch (event.type) {

    // ── Checkout concluído ──────────────────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const { userId, planId, tenantSlug } = session.metadata || {}
      if (!userId) break

      // Se for trial por PIX pago → criar subscription com 29 dias extra
      if (session.metadata?.paymentType === 'pix_first_month' && planId) {
        const customer = await stripe.customers.create({
          metadata: { userId, planId },
          email: session.customer_details?.email ?? undefined,
          name: session.customer_details?.name ?? undefined,
        })
        const PLAN_PRICES: Record<string, number> = {
          STARTER: 7900, PRO: 14900, PREMIUM: 24900,
        }
        // price_data com product_data inline e suportado em runtime pelo Stripe
        // (cria produto on-the-fly), mas o tipo PriceData nao declara product_data.
        const priceData = {
          currency: 'brl',
          product_data: { name: `STYLOGESTOR ${planId}` },
          unit_amount: PLAN_PRICES[planId] ?? 14900,
          recurring: { interval: 'month' as const },
        } as unknown as Stripe.SubscriptionCreateParams.Item.PriceData
        const sub = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price_data: priceData }],
          trial_period_days: 29,
          metadata: { userId, planId, tenantSlug: tenantSlug ?? '' },
        })
        await updateUserSubscription(userId, 'trial', planId, sub.id)
        await syncSubscriptionDB({
          clerkUserId: userId,
          stripeSubId: sub.id,
          stripeCustomerId: customer.id,
          plan: planId,
          status: 'trial',
          currentPeriodStart: new Date(getPeriodStart(sub) * 1000),
          currentPeriodEnd: new Date(getPeriodEnd(sub) * 1000),
        })
      } else {
        await updateUserSubscription(userId, 'trial', planId)
      }

      // Email de boas-vindas
      if (session.customer_details?.email && session.customer_details?.name) {
        await sendWelcomeEmail(
          session.customer_details.email,
          session.customer_details.name,
        )
      }
      break
    }

    // ── Subscription criada ─────────────────────────────────────
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const { userId, planId } = sub.metadata || {}
      if (!userId) break
      const status = sub.status === 'trialing' ? 'trial' : sub.status === 'active' ? 'active' : sub.status
      await updateUserSubscription(userId, status, planId, sub.id)
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      await syncSubscriptionDB({
        clerkUserId: userId,
        stripeSubId: sub.id,
        stripeCustomerId: customerId,
        plan: planId ?? 'PRO',
        status,
        currentPeriodStart: new Date(getPeriodStart(sub) * 1000),
        currentPeriodEnd: new Date(getPeriodEnd(sub) * 1000),
      })
      break
    }

    // ── Subscription atualizada (mudança de plano, status, etc.) ─
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const { userId, planId } = sub.metadata || {}
      if (!userId) break
      const statusMap: Record<string, string> = {
        active: 'active', trialing: 'trial',
        past_due: 'past_due', canceled: 'canceled',
        unpaid: 'past_due', paused: 'past_due',
      }
      const newStatus = statusMap[sub.status] ?? sub.status
      await updateUserSubscription(userId, newStatus, planId, sub.id)
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      await syncSubscriptionDB({
        clerkUserId: userId,
        stripeSubId: sub.id,
        stripeCustomerId: customerId,
        plan: planId ?? 'PRO',
        status: newStatus,
        currentPeriodStart: new Date(getPeriodStart(sub) * 1000),
        currentPeriodEnd: new Date(getPeriodEnd(sub) * 1000),
      })
      break
    }

    // ── Subscription cancelada ──────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const { userId } = sub.metadata || {}
      if (!userId) break
      await updateUserSubscription(userId, 'canceled')
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      await syncSubscriptionDB({
        clerkUserId: userId,
        stripeSubId: sub.id,
        stripeCustomerId: customerId,
        plan: 'FREE',
        status: 'canceled',
        canceledAt: new Date(),
      })
      break
    }

    // ── Pagamento falhou ────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = getSubIdFromInvoice(invoice)
      if (!subId) break
      const sub = await stripe.subscriptions.retrieve(subId)
      const { userId } = sub.metadata || {}
      if (!userId) break
      await updateUserSubscription(userId, 'past_due')
      // Email de cobrança falhou
      const customer = typeof invoice.customer === 'string'
        ? await stripe.customers.retrieve(invoice.customer)
        : invoice.customer
      if (customer && !('deleted' in customer) && customer.email) {
        const amount = new Intl.NumberFormat('pt-BR', {
          style: 'currency', currency: 'BRL',
        }).format((invoice.amount_due ?? 0) / 100)
        await sendPaymentFailedEmail(customer.email, customer.name ?? 'Cliente', amount)
      }
      break
    }

    // ── Pagamento bem-sucedido ──────────────────────────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.billing_reason === 'subscription_create') break // já tratado em created
      const subId = getSubIdFromInvoice(invoice)
      if (!subId) break
      const sub = await stripe.subscriptions.retrieve(subId)
      const { userId, planId } = sub.metadata || {}
      if (!userId) break
      await updateUserSubscription(userId, 'active', planId, sub.id)
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      await syncSubscriptionDB({
        clerkUserId: userId,
        stripeSubId: sub.id,
        stripeCustomerId: customerId,
        plan: planId ?? 'PRO',
        status: 'active',
        currentPeriodStart: new Date(getPeriodStart(sub) * 1000),
        currentPeriodEnd: new Date(getPeriodEnd(sub) * 1000),
      })
      break
    }

    default:
      console.log(`[STRIPE_WEBHOOK] Ignorado: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
