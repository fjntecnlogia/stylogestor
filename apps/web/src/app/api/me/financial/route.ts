import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

/**
 * GET /api/me/financial?period=today|week|month|custom&from=&to=
 *
 * Retorna entradas (Payments via agenda) + saídas (Transactions
 * type=EXPENSE) + KPIs agregados pro painel /financeiro.
 *
 * `period`: atalho. Se vier 'custom', usa from/to (YYYY-MM-DD).
 * Default: month (mês corrente).
 */
export async function GET(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const url = req.nextUrl
    const period = url.searchParams.get('period') ?? 'month'
    const fromParam = url.searchParams.get('from')
    const toParam = url.searchParams.get('to')

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let from: Date
    let to: Date
    if (period === 'today') {
      from = startOfToday
      to = new Date(startOfToday.getTime() + 86400000)
    } else if (period === 'week') {
      const day = startOfToday.getDay()
      from = new Date(startOfToday.getTime() - day * 86400000)
      to = new Date(from.getTime() + 7 * 86400000)
    } else if (period === 'custom' && fromParam && toParam) {
      from = new Date(`${fromParam}T00:00:00`)
      to = new Date(`${toParam}T23:59:59.999`)
    } else {
      // month (default)
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      to = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }

    const [payments, expenses, completedCount] = await Promise.all([
      // Entradas: Payments de appointments do tenant no período
      prisma.payment.findMany({
        where: {
          appointment: { tenantId },
          paidAt: { gte: from, lt: to },
        },
        include: {
          appointment: {
            select: {
              client: { select: { name: true } },
              professional: { select: { name: true } },
              services: { include: { service: { select: { name: true } } } },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
      }),
      // Saídas: Transactions de despesa (quando o módulo de transações
      // estiver totalmente plugado pelo gestor)
      prisma.transaction.findMany({
        where: { tenantId, type: 'EXPENSE', date: { gte: from, lt: to } },
        orderBy: { date: 'desc' },
      }),
      prisma.appointment.count({
        where: {
          tenantId,
          status: 'COMPLETED',
          startTime: { gte: from, lt: to },
        },
      }),
    ])

    const totalIn = payments.reduce((s, p) => s + Number(p.amount), 0)
    const totalOut = expenses.reduce((s, e) => s + Number(e.amount), 0)
    const ticketMedio = completedCount > 0 ? Math.round(totalIn / completedCount) : 0

    // Agrupa por método de pagamento (pra gráfico)
    const byMethod: Record<string, number> = {}
    payments.forEach((p) => {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount)
    })

    return NextResponse.json({
      period: { from: from.toISOString(), to: to.toISOString() },
      kpis: {
        totalIn,
        totalOut,
        net: totalIn - totalOut,
        atendimentos: completedCount,
        ticketMedio,
      },
      byMethod,
      entries: payments.map((p) => ({
        id: p.id,
        type: 'in' as const,
        amount: Number(p.amount),
        method: p.method,
        paidAt: p.paidAt.toISOString(),
        client: p.appointment.client.name,
        professional: p.appointment.professional.name,
        service: p.appointment.services.map((s) => s.service.name).join(' + ') || '—',
      })),
      expenses: expenses.map((e) => ({
        id: e.id,
        type: 'out' as const,
        amount: Number(e.amount),
        category: e.category ?? 'Outros',
        description: e.description ?? '',
        date: e.date.toISOString(),
      })),
    })
  } catch (err) {
    console.error('[FINANCIAL_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar financeiro' }, { status: 500 })
  }
}
