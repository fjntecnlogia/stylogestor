import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'

async function updateUserSubscription(userId: string, status: string) {
  try {
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { subscriptionStatus: status },
    })
    console.log(`[CLERK_META] userId=${userId} subscriptionStatus=${status}`)
  } catch (err) {
    console.error('[CLERK_META_ERROR]', err)
  }
}

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

  switch (event.type) {

    // Checkout concluído (cartão/boleto)
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const { userId, planId, paymentType } = session.metadata || {}

      if (paymentType === 'pix_first_month' && userId && planId) {
        // PIX pago — criar assinatura com 29 dias trial
        const stripe = getStripe()
        const customer = await stripe.customers.create({
          metadata: { userId, planId },
        })
        await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price_data: { currency: 'brl', product_data: { name: `STYLOGESTOR ${planId}` }, unit_amount: 14900, recurring: { interval: 'month' } } }],
          trial_period_days: 29,
          metadata: { userId, planId },
        })
        await updateUserSubscription(userId, 'trial')
      } else if (userId) {
        await updateUserSubscription(userId, 'trial')
      }
      break
    }

    // Assinatura ativa/renovada
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId
      if (!userId) break
      const statusMap: Record<string, string> = {
        active: 'active',
        trialing: 'trial',
        past_due: 'past_due',
        canceled: 'canceled',
        unpaid: 'past_due',
        paused: 'past_due',
      }
      const newStatus = statusMap[sub.status] || sub.status
      await updateUserSubscription(userId, newStatus)
      break
    }

    // Assinatura cancelada
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId
      if (userId) await updateUserSubscription(userId, 'canceled')
      break
    }

    // Pagamento falhou → bloquear
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
      if (!subId) break
      const stripe = getStripe()
      const sub = await stripe.subscriptions.retrieve(subId)
      const userId = sub.metadata?.userId
      if (userId) await updateUserSubscription(userId, 'past_due')
      break
    }

    // Pagamento bem-sucedido → desbloquear
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
      if (!subId) break
      const stripe = getStripe()
      const sub = await stripe.subscriptions.retrieve(subId)
      const userId = sub.metadata?.userId
      if (userId) await updateUserSubscription(userId, 'active')
      break
    }

    default:
      console.log(`[STRIPE_WEBHOOK] Ignorado: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
