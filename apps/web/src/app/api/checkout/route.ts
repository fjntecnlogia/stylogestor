import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe, PLANS } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { planId } = await req.json()
    const plan = PLANS.find((p) => p.id === planId)
    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: `STYLOGESTOR ${plan.name}`,
              description: plan.description,
            },
            unit_amount: plan.price,
            recurring: { interval: plan.interval },
          },
          quantity: 1,
        },
      ],
      metadata: { userId, planId: plan.id },
      success_url: `${appUrl}/sucesso?session_id={CHECKOUT_SESSION_ID}&plan=${plan.id}`,
      cancel_url: `${appUrl}/planos?canceled=1`,
      locale: 'pt-BR',
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[CHECKOUT_ERROR]', error)
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 })
  }
}
