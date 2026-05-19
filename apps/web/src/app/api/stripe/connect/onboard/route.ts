import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'

// Cria conta Express no Stripe Connect para a barbearia receber pagamentos
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { tenantName, email: bodyEmail } = body as { tenantName?: string; email?: string }

    // Email: 1º tenta o que veio no body, 2º busca do Clerk se vazio/inválido.
    // Stripe Connect EXIGE email válido — antes mandávamos string vazia e
    // dava "Invalid email address".
    let email = bodyEmail
    if (!email || !email.includes('@') || email.endsWith('@clerk.temp')) {
      const user = await currentUser()
      email =
        user?.primaryEmailAddress?.emailAddress ??
        user?.emailAddresses?.[0]?.emailAddress ??
        undefined
    }
    if (!email) {
      return NextResponse.json(
        { error: 'Email não configurado. Adicione um email no seu perfil Clerk antes de conectar com Stripe.' },
        { status: 400 },
      )
    }

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
      metadata: { userId, tenantName: tenantName ?? '' },
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
