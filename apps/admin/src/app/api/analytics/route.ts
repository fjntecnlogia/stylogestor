import { NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { requireAdmin } from '@/lib/require-admin'

/**
 * GET /api/analytics
 *
 * Dados reais consolidados pra aba "Analytics do SaaS" do admin.
 * Substitui todos os mocks (KPIs, gráficos, distribuição, top pages).
 *
 * Estrutura da resposta:
 *   {
 *     kpis: {
 *       visitsToday, visitsYesterday, visitsChangePct,
 *       newTenantsThisWeek, newTenantsPrevWeek, tenantsChangePct,
 *       conversionRate ('active' / (trial + expired + active)),
 *       churnRate (canceled últimos 30d / active início do mês),
 *     },
 *     siteVisitsLast13Days: [{ date: '2026-06-05', count: 128 }, ...],
 *     newTenantsLast30Days: [{ date, count }, ...],  // pra "Novos cadastros por dia"
 *     planDistribution: [{ plan: 'PRO', count: 3, pct: 50 }, ...],
 *     topPages: [{ path: '/', views: 324, pct: 100 }, ...],   // últimos 30d
 *   }
 *
 * Zero-fill nos ranges de data pra o gráfico não pular dia sem visita.
 * Todas as queries em paralelo (Promise.all) — resposta rápida mesmo
 * com múltiplas agregações.
 */
export async function GET() {
  const guard = await requireAdmin()
  if (guard) return guard

  try {
    const now = new Date()
    const startOfToday = new Date(now); startOfToday.setUTCHours(0, 0, 0, 0)
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setUTCDate(startOfYesterday.getUTCDate() - 1)
    const startOfWeek = new Date(startOfToday); startOfWeek.setUTCDate(startOfWeek.getUTCDate() - 7)
    const startOfPrevWeek = new Date(startOfWeek); startOfPrevWeek.setUTCDate(startOfPrevWeek.getUTCDate() - 7)
    const start30DaysAgo = new Date(startOfToday); start30DaysAgo.setUTCDate(start30DaysAgo.getUTCDate() - 30)
    const start13DaysAgo = new Date(startOfToday); start13DaysAgo.setUTCDate(start13DaysAgo.getUTCDate() - 12) // 13 dias INCLUINDO hoje
    const startOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1)

    // Rodamos tudo em paralelo — nenhuma query depende da outra.
    const [
      visitsToday,
      visitsYesterday,
      newTenantsThisWeek,
      newTenantsPrevWeek,
      subCounts,
      canceledLast30Days,
      activeAtStartOfMonth,
      visitsDaily,
      tenantsDaily,
      topPagesRaw,
    ] = await Promise.all([
      prisma.siteVisit.count({ where: { ts: { gte: startOfToday } } }),
      prisma.siteVisit.count({ where: { ts: { gte: startOfYesterday, lt: startOfToday } } }),
      prisma.tenant.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.tenant.count({ where: { createdAt: { gte: startOfPrevWeek, lt: startOfWeek } } }),
      // Contagem por status pra conversion rate + churn base
      prisma.subscription.groupBy({ by: ['status'], _count: { _all: true } }),
      // Cancelados nos últimos 30 dias
      prisma.subscription.count({ where: { status: 'canceled', canceledAt: { gte: start30DaysAgo } } }),
      // Active no começo do mês — proxy: subs criadas antes do início do mês e não canceladas antes
      prisma.subscription.count({
        where: {
          createdAt: { lt: startOfMonth },
          OR: [{ canceledAt: null }, { canceledAt: { gte: startOfMonth } }],
        },
      }),
      // Séries diárias — raw SQL pra agrupar por dia com zero-fill via generate_series
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT to_char(d.day, 'YYYY-MM-DD') AS date, COUNT(v.id)::bigint AS count
        FROM generate_series(${start13DaysAgo}::date, ${startOfToday}::date, '1 day') AS d(day)
        LEFT JOIN "site_visits" v ON date_trunc('day', v.ts) = d.day
        GROUP BY d.day ORDER BY d.day ASC
      `,
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT to_char(d.day, 'YYYY-MM-DD') AS date, COUNT(t.id)::bigint AS count
        FROM generate_series(${start30DaysAgo}::date, ${startOfToday}::date, '1 day') AS d(day)
        LEFT JOIN "tenants" t ON date_trunc('day', t."createdAt") = d.day
        GROUP BY d.day ORDER BY d.day ASC
      `,
      prisma.$queryRaw<Array<{ path: string; views: bigint }>>`
        SELECT path, COUNT(*)::bigint AS views
        FROM "site_visits"
        WHERE ts >= ${start30DaysAgo}
        GROUP BY path ORDER BY views DESC LIMIT 6
      `,
    ])

    // KPIs derivados
    const visitsChangePct = visitsYesterday > 0
      ? Math.round(((visitsToday - visitsYesterday) / visitsYesterday) * 100)
      : null
    const tenantsChangePct = newTenantsPrevWeek > 0
      ? Math.round(((newTenantsThisWeek - newTenantsPrevWeek) / newTenantsPrevWeek) * 100)
      : null

    // Conversion rate: subs ativas / total (ativa + trial + expired) — proxy simples
    const bucket = { active: 0, trial: 0, expired: 0, canceled: 0, past_due: 0, unpaid: 0 } as Record<string, number>
    for (const row of subCounts) bucket[row.status] = row._count._all
    const totalRelevant = bucket.active + bucket.trial + bucket.expired
    const conversionRate = totalRelevant > 0
      ? Math.round((bucket.active / totalRelevant) * 1000) / 10  // 1 casa decimal
      : 0

    const churnRate = activeAtStartOfMonth > 0
      ? Math.round((canceledLast30Days / activeAtStartOfMonth) * 1000) / 10
      : 0

    // Distribuição por plano — só das assinaturas ATIVAS/TRIAL (que "contam")
    const activePlansRaw = await prisma.subscription.groupBy({
      by: ['plan'],
      where: { status: { in: ['active', 'trial'] } },
      _count: { _all: true },
    })
    const totalActivePlans = activePlansRaw.reduce((s, r) => s + r._count._all, 0)
    const planDistribution = ['PREMIUM', 'PRO', 'STARTER', 'FREE'].map((plan) => {
      const row = activePlansRaw.find((r) => r.plan === plan)
      const count = row?._count._all ?? 0
      const pct = totalActivePlans > 0 ? Math.round((count / totalActivePlans) * 100) : 0
      return { plan, count, pct }
    }).filter((p) => p.count > 0)

    // Top pages — normaliza pct sobre o maior valor
    const topViews = topPagesRaw[0]?.views ? Number(topPagesRaw[0].views) : 0
    const topPages = topPagesRaw.map((r) => ({
      path: r.path,
      views: Number(r.views),
      pct: topViews > 0 ? Math.round((Number(r.views) / topViews) * 100) : 0,
    }))

    return NextResponse.json({
      kpis: {
        visitsToday,
        visitsYesterday,
        visitsChangePct,
        newTenantsThisWeek,
        newTenantsPrevWeek,
        tenantsChangePct,
        conversionRate,
        churnRate,
      },
      siteVisitsLast13Days: visitsDaily.map((r) => ({ date: r.date, count: Number(r.count) })),
      newTenantsLast30Days: tenantsDaily.map((r) => ({ date: r.date, count: Number(r.count) })),
      planDistribution,
      topPages,
    })
  } catch (err) {
    console.error('[ADMIN_ANALYTICS_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar analytics' }, { status: 500 })
  }
}
