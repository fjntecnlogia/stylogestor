import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'

// Cria conta Express no Stripe Connect para a barbearia receber pagamentos
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { tenantName, email } = await req.json()
    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'

    // Cria conta Express (simplificada — barbearia não precisa de conta Stripe própria)
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: { userId, tenantName },
    })

    // Link de onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/configuracoes?connect=retry`,
      return_url: `${appUrl}/configuracoes?connect=success&account=${account.id}`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url, accountId: account.id })
  } catch (error: unknown) {
    console.error('[CONNECT_ONBOARD_ERROR]', error)
    const msg = error instanceof Error ? error.message : 'Erro ao criar conta'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
