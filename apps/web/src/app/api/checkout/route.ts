import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getStripe, PLANS } from '@/lib/stripe'

/**
 * POST /api/checkout
 *
 * Checkout cartão/boleto — assinatura recorrente (mode subscription).
 *
 * Diferenças vs /api/checkout/pix:
 *   - mode: subscription (recorrência automática)
 *   - 14 dias de trial via subscription_data
 *   - aceita card + boleto (PIX só no endpoint /pix)
 *
 * Customizações compartilhadas (mantidas em sync com /pix):
 *   - email pré-preenchido (Clerk)
 *   - telefone obrigatório
 *   - tax_id (CPF/CNPJ) opcional
 *   - cupom de desconto habilitado
 *   - description com bullets das features do plano
 *   - billing_address pra emissão de NF
 */
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

    const user = await currentUser()
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress ??
      undefined

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'
    const isAnual = ciclo === 'anual'
    const unitAmount = isAnual ? plan.priceAnnual : plan.priceMonthly
    const interval = isAnual ? 'year' : 'month'

    // Bullets de features — usa checkoutFeatures (subset enxuto) pra
    // não truncar no Stripe. Lista completa fica só na página /planos.
    const featuresBullets = plan.checkoutFeatures.map((f) => `✓ ${f}`).join('\n')
    const cicloLabel = isAnual ? '2 meses grátis no plano anual' : 'Cobrança mensal'
    const description = [
      `${plan.subdesc} · ${plan.description}`,
      '',
      featuresBullets,
      '',
      `🎁 14 dias grátis · ${cicloLabel} · cancele a qualquer momento`,
    ].join('\n')

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
              description,
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
      // Pré-preenche email do usuário logado
      ...(email ? { customer_email: email } : {}),
      // Telefone do gestor — usamos pra WhatsApp depois
      phone_number_collection: { enabled: true },
      // CPF/CNPJ opcional — útil pra NF
      tax_id_collection: { enabled: true },
      // Cupons promocionais ativados
      allow_promotion_codes: true,
      // Endereço de cobrança opcional (auto = só se necessário)
      billing_address_collection: 'auto',
      // Texto motivacional acima do botão "Pagar"
      custom_text: {
        submit: {
          message:
            'Você não é cobrado hoje. Os 14 dias grátis começam após o cadastro do cartão. Cancele a qualquer momento.',
        },
      },
      success_url: `${appUrl}/sucesso?session_id={CHECKOUT_SESSION_ID}&plan=${plan.id}&ciclo=${ciclo}`,
      cancel_url: `${appUrl}/planos?canceled=1`,
      locale: 'pt-BR',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('[CHECKOUT_ERROR]', error)
    const message = error instanceof Error ? error.message : 'Erro ao criar sessão'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
