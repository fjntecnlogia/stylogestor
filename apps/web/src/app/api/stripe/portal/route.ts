import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'

    // Buscar customer pelo userId nos metadados
    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
    })

    let customerId: string

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      // Criar customer se não existir
      const customer = await stripe.customers.create({
        metadata: { userId },
      })
      customerId = customer.id
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/planos`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('[PORTAL_ERROR]', error)
    const msg = error instanceof Error ? error.message : 'Erro ao abrir portal'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
