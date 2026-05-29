import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'
import { getStripe, PLANS } from '@/lib/stripe'

/**
 * POST /api/checkout/pix
 *
 * Checkout PIX = pagamento único do primeiro mês.
 * Após confirmação, webhook cria a assinatura com 29 dias de trial.
 *
 * Esse endpoint cria uma sessão "rica" do Stripe Checkout:
 *   - Email pré-preenchido (vem do Clerk — usuário não digita 2x)
 *   - Telefone obrigatório (pra termos o WhatsApp do gestor)
 *   - Tax ID opcional (CPF/CNPJ — útil pra emissão de NF depois)
 *   - Cupom de desconto habilitado (ex.: BLACK50, INFLUENCER)
 *   - Description com bullets das features do plano (vende melhor)
 *
 * Limites:
 *   - PIX no Stripe expira em 30min após criação (configurado via expires_at)
 *   - Mode 'payment' (one-shot) — diferente do mode 'subscription' do
 *     checkout cartão/boleto. Quem migra pra recorrente é o webhook.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { planId } = await req.json()
    const plan = PLANS.find((p) => p.id === planId)
    if (!plan) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })

    // Email do usuário Supabase logado pra pré-preencher o checkout
    const email = user.email ?? undefined

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'
    const stripe = getStripe()

    // Description vira bullets numa linha única — Stripe colapsa \n e
    // trunca após ~2 linhas visuais. Por isso evitamos quebras: linha
    // única com separador "  " entre os checks cabe sem truncar e
    // mantém leitura visual. O "14 dias grátis" e o gancho de cancela-
    // mento já estão no custom_text.submit.message acima do botão.
    const description = plan.checkoutFeatures.map((f) => `✓ ${f}`).join('  ')

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['pix'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `STYLOGESTOR ${plan.name} — Primeiro mês`,
              description,
            },
            unit_amount: plan.priceMonthly,
          },
          quantity: 1,
        },
      ],
      metadata: { userId: user.id, planId: plan.id, paymentType: 'pix_first_month' },
      payment_intent_data: {
        metadata: { userId: user.id, planId: plan.id, paymentType: 'pix_first_month' },
      },
      // Pré-preenche email do usuário logado — uma fricção a menos
      ...(email ? { customer_email: email } : {}),
      // Cria Customer no Stripe sempre (necessário pra tax_id_collection)
      customer_creation: 'always',
      // Telefone do gestor — usamos pra WhatsApp depois
      phone_number_collection: { enabled: true },
      // CPF/CNPJ opcional — útil pra emitir NF futuramente sem ter que pedir
      tax_id_collection: { enabled: true },
      // Cupons como INFLUENCER, BLACK50 — input visível no checkout
      allow_promotion_codes: true,
      // Texto motivacional acima do botão "Pagar"
      custom_text: {
        submit: {
          message:
            'Após confirmar o PIX, sua barbearia é ativada na hora. 14 dias grátis e cancelamento a qualquer momento.',
        },
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
