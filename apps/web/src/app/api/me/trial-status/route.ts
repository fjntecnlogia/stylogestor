import { NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

/**
 * GET /api/me/trial-status
 *
 * Retorna info do trial/assinatura do tenant logado pra mostrar no header.
 * Response shape:
 *   {
 *     status: 'trial' | 'active' | 'expired' | 'canceled' | 'unknown',
 *     daysRemaining: number,  // dias até trialEndsAt (ou periodEnd)
 *     trialEndsAt: string | null,  // ISO date
 *     isPaying: boolean,  // true se status='active' (pagante)
 *   }
 */
export async function GET() {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        trialEndsAt: true,
        active: true,
        subscription: {
          select: { status: true, currentPeriodEnd: true, plan: true },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
    }

    const sub = tenant.subscription
    const endDate = tenant.trialEndsAt ?? sub?.currentPeriodEnd ?? null
    const now = new Date()
    const daysRemaining = endDate
      ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    // Determina status efetivo
    let status: 'trial' | 'active' | 'expired' | 'canceled' | 'unknown' = 'unknown'
    if (!tenant.active || sub?.status === 'canceled') {
      status = 'canceled'
    } else if (sub?.status === 'active') {
      status = 'active'
    } else if (sub?.status === 'trial' || !sub) {
      status = daysRemaining > 0 ? 'trial' : 'expired'
    } else if (sub?.status === 'past_due') {
      status = 'expired'
    }

    return NextResponse.json({
      status,
      daysRemaining,
      trialEndsAt: endDate ? endDate.toISOString() : null,
      isPaying: status === 'active',
      plan: sub?.plan ?? 'FREE',
    })
  } catch (err) {
    console.error('[TRIAL_STATUS_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 })
  }
}
