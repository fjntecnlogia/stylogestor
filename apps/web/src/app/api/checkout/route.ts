import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe, PLANS } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { planId, ciclo = 'mensal' } = await req.json()

    const plan = PLANS.find((p) => p.id === planId)
    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'
    const isAnual = ciclo === 'anual'
    const unitAmount = isAnual ? plan.priceAnnual : plan.priceMonthly
    const interval = isAnual ? 'year' : 'month'

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: `STYLOGESTOR ${plan.name}${isAnual ? ' (Anual)' : ''}`,
              description: plan.description,
            },
            unit_amount: unitAmount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      metadata: { userId, planId: plan.id, ciclo },
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId, planId: plan.id },
      },
      success_url: `${appUrl}/sucesso?session_id={CHECKOUT_SESSION_ID}&plan=${plan.id}&ciclo=${ciclo}`,
      cancel_url: `${appUrl}/planos?canceled=1`,
      locale: 'pt-BR',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('[CHECKOUT_ERROR]', error)
    const message = error instanceof Error ? error.message : 'Erro ao criar sessão'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
