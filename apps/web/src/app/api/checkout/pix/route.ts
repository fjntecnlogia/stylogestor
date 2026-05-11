import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe, PLANS } from '@/lib/stripe'

// Checkout PIX = pagamento único do primeiro mês
// Após confirmação, webhook cria a assinatura com 29 dias de trial
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { planId } = await req.json()
    const plan = PLANS.find((p) => p.id === planId)
    if (!plan) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'
    const stripe = getStripe()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['pix'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `STYLOGESTOR ${plan.name} — Primeiro mês (PIX)`,
              description: '14 dias grátis + primeiro mês. Próximas cobranças no cartão.',
            },
            unit_amount: plan.priceMonthly,
          },
          quantity: 1,
        },
      ],
      metadata: { userId, planId: plan.id, paymentType: 'pix_first_month' },
      payment_intent_data: {
        metadata: { userId, planId: plan.id, paymentType: 'pix_first_month' },
      },
      success_url: `${appUrl}/sucesso?plan=${plan.id}&metodo=pix`,
      cancel_url: `${appUrl}/planos?canceled=1`,
      locale: 'pt-BR',
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // PIX expira em 30 min
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('[PIX_CHECKOUT_ERROR]', error)
    const msg = error instanceof Error ? error.message : 'Erro ao criar sessão PIX'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
