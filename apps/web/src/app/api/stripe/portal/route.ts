import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'
import { getCurrentTenantId } from '@/lib/auth-tenant'
import { prisma } from '@stylogestor/database'
import { getStripe } from '@/lib/stripe'

export async function POST(_req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const tenantId = await getCurrentTenantId()
    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'

    // Continuidade: o customer correto é o salvo na assinatura do tenant
    // (migrados do Clerk têm o clerkId no metadata do Stripe, então buscar por
    // userId não acharia — por isso priorizamos o stripeCustomerId do banco).
    let customerId: string | undefined
    if (tenantId) {
      const sub = await prisma.subscription.findUnique({
        where: { tenantId },
        select: { stripeCustomerId: true },
      })
      customerId = sub?.stripeCustomerId ?? undefined
    }

    // Fallback: procura por metadata (supabaseId atual) e por fim cria.
    if (!customerId) {
      const found = await stripe.customers.search({
        query: `metadata['userId']:'${user.id}'`,
      })
      customerId = found.data[0]?.id
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId: user.id, tenantId: tenantId ?? '' },
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
