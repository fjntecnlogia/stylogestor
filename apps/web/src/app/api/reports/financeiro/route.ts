import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'
import { getCurrentTenantId } from '@/lib/auth-tenant'
import { prisma } from '@stylogestor/database'

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const tenantId = await getCurrentTenantId()
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
    const { searchParams } = new URL(req.url)
    const periodo = searchParams.get('periodo') || 'mes' // hoje | semana | mes | ano

    // Calcular intervalo de datas
    const now = new Date()
    let start = new Date()
    if (periodo === 'hoje') {
      start.setHours(0, 0, 0, 0)
    } else if (periodo === 'semana') {
      const day = now.getDay()
      start.setDate(now.getDate() - day)
      start.setHours(0, 0, 0, 0)
    } else if (periodo === 'mes') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (periodo === 'ano') {
      start = new Date(now.getFullYear(), 0, 1)
    }

    // Buscar transações reais
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        date: { gte: start, lte: now },
      },
      orderBy: { date: 'desc' },
      take: 200,
    })

    // Agrupar por dia para o gráfico (últimos 30 dias)
    const last30 = new Date()
    last30.setDate(last30.getDate() - 30)

    const allTransactions = await prisma.transaction.findMany({
      where: { tenantId, date: { gte: last30 } },
      orderBy: { date: 'asc' },
    })

    const byDay: Record<string, { income: number; expense: number }> = {}
    for (const t of allTransactions) {
      const day = t.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      if (!byDay[day]) byDay[day] = { income: 0, expense: 0 }
      if (t.type === 'INCOME') byDay[day].income += Number(t.amount)
      else byDay[day].expense += Number(t.amount)
    }

    const chartData = Object.entries(byDay).map(([day, vals]) => ({ day, ...vals }))

    // Agrupar por método de pagamento
    const byMethod: Record<string, number> = {}
    for (const t of transactions.filter(t => t.type === 'INCOME')) {
      const m = t.paymentMethod ?? 'OUTROS'
      byMethod[m] = (byMethod[m] ?? 0) + Number(t.amount)
    }
    const totalIncome = Object.values(byMethod).reduce((s, v) => s + v, 0)
    const paymentMethods = Object.entries(byMethod).map(([method, total]) => ({
      method: method === 'PIX' ? 'PIX' : method === 'CASH' ? 'Dinheiro' : method === 'CREDIT_CARD' ? 'Cartão' : 'Outros',
      total,
      pct: totalIncome > 0 ? Math.round(total / totalIncome * 100) : 0,
      color: method === 'PIX' ? '#1B8A5A' : method === 'CASH' ? '#F5A623' : method === 'CREDIT_CARD' ? '#1A3A6B' : '#9CA3AF',
    }))

    const income  = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0)
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)

    return NextResponse.json({
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        desc: t.description,
        cat: t.category,
        method: t.paymentMethod ?? 'OUTROS',
        amount: Number(t.amount),
        date: t.date.toLocaleDateString('pt-BR'),
        time: t.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: t.status,
      })),
      summary: { income, expense, balance: income - expense },
      chartData,
      paymentMethods,
      periodo,
    })
  } catch (err) {
    console.error('[REPORT_FINANCEIRO_ERROR]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
