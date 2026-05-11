import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret não configurado' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[WEBHOOK_SIG_ERROR]', err)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  console.log(`[STRIPE_WEBHOOK] Evento recebido: ${event.type}`)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const { userId, planId } = session.metadata || {}
      console.log(`[CHECKOUT_COMPLETED] userId=${userId} planId=${planId} subscriptionId=${session.subscription}`)
      // TODO: Salvar no banco — userId + planId + subscriptionId
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      console.log(`[SUB_UPDATED] subscriptionId=${sub.id} status=${sub.status}`)
      // TODO: Atualizar status no banco
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      console.log(`[SUB_DELETED] subscriptionId=${sub.id}`)
      // TODO: Marcar como cancelado no banco
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.log(`[PAYMENT_FAILED] customerId=${invoice.customer}`)
      // TODO: Notificar usuário por e-mail/WhatsApp
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      console.log(`[PAYMENT_OK] customerId=${invoice.customer} amount=${invoice.amount_paid}`)
      break
    }

    default:
      console.log(`[STRIPE_WEBHOOK] Evento ignorado: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
