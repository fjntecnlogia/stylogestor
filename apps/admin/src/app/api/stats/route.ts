import { NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { requireAdmin } from '@/lib/require-admin'

export async function GET() {
  const guard = await requireAdmin()
  if (guard) return guard

  try {
    const [totalTenants, totalClients, totalAppts, subscriptions] = await Promise.all([
      prisma.tenant.count({ where: { active: true } }),
      prisma.client.count(),
      prisma.appointment.count(),
      prisma.subscription.findMany({ where: { status: { in: ['active', 'past_due'] } } }),
    ])

    const MRR_MAP: Record<string, number> = { STARTER: 79, PRO: 149, PREMIUM: 249 }
    const totalMRR = subscriptions.reduce((s, sub) => s + (MRR_MAP[sub.plan] ?? 0), 0)
    const trials = await prisma.subscription.count({ where: { status: 'trial' } })
    const active = subscriptions.filter(s => s.status === 'active').length

    return NextResponse.json({ totalMRR, totalTenants, active, trials, totalClients, totalAppts })
  } catch (err) {
    console.error('[ADMIN_STATS_ERROR]', err)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
