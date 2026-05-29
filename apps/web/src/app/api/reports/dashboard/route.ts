import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'
import { getCurrentTenantId } from '@/lib/auth-tenant'
import { prisma } from '@stylogestor/database'
import { startOfTodayBR, endOfTodayBR, startOfMonthBR } from '@/lib/datetime-br'

export async function GET() {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const tenantId = await getCurrentTenantId()
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
    // Datas no fuso BR — sem isso o server (UTC) pegava janela errada
    // do dia. Ex: agendamento das 23h BRT (= 02h UTC do dia seguinte)
    // não aparecia no "hoje" UTC.
    const hoje = startOfTodayBR()
    const amanha = endOfTodayBR()
    const now = new Date()
    const inicioMes = startOfMonthBR(now.getUTCFullYear(), now.getUTCMonth())

    const [
      agendamentosHoje,
      agendamentosMes,
      totalClientes,
      receitaMes,
      despesaMes,
      novosClientesMes,
      paymentsHoje,
    ] = await Promise.all([
      prisma.appointment.findMany({
        where: { tenantId, date: { gte: hoje, lte: amanha }, status: { notIn: ['CANCELED', 'NO_SHOW'] } },
        include: {
          client:       { select: { name: true, phone: true } },
          professional: { select: { name: true } },
          services:     { include: { service: { select: { name: true } } } },
          payments:     { select: { method: true, amount: true } },
        },
        orderBy: { startTime: 'asc' },
      }),
      prisma.appointment.count({
        where: { tenantId, date: { gte: inicioMes }, status: { notIn: ['CANCELED', 'NO_SHOW'] } },
      }),
      prisma.client.count({ where: { tenantId, active: true } }),
      prisma.transaction.aggregate({
        where: { tenantId, type: 'INCOME', date: { gte: inicioMes } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { tenantId, type: 'EXPENSE', date: { gte: inicioMes } },
        _sum: { amount: true },
      }),
      prisma.client.count({
        where: { tenantId, createdAt: { gte: inicioMes } },
      }),
      // Pagamentos do dia (entradas reais via /agenda concluindo atendimentos)
      prisma.payment.findMany({
        where: {
          appointment: { tenantId },
          paidAt: { gte: hoje, lte: amanha },
        },
        include: {
          appointment: {
            select: {
              client: { select: { name: true } },
              services: { include: { service: { select: { name: true } } } },
            },
          },
        },
        orderBy: { paidAt: 'asc' },
      }),
    ])

    const receitaTotal = Number(receitaMes._sum.amount ?? 0)
    const despesaTotal = Number(despesaMes._sum.amount ?? 0)
    const totalHoje = paymentsHoje.reduce((s, p) => s + Number(p.amount), 0)
    const completedHoje = agendamentosHoje.filter((a) => a.status === 'COMPLETED').length
    const ticketMedio = completedHoje > 0 ? Math.round(totalHoje / completedHoje) : 0

    // Alertas
    const alerts = []

    // Clientes sem visita há 30 dias
    const trintaDias = new Date()
    trintaDias.setDate(trintaDias.getDate() - 30)
    const clientesSemVisita = await prisma.client.count({
      where: { tenantId, lastVisit: { lt: trintaDias }, active: true },
    })
    if (clientesSemVisita > 0) {
      alerts.push({ type: 'warning', msg: `${clientesSemVisita} clientes sem visita há mais de 30 dias` })
    }

    // Estoque baixo
    const estoqueBaixo = await prisma.product.count({
      where: { tenantId, active: true, stock: { lte: prisma.product.fields.minStock } },
    }).catch(() => 0)
    if (estoqueBaixo > 0) {
      alerts.push({ type: 'stock', msg: `${estoqueBaixo} produto(s) com estoque baixo` })
    }

    return NextResponse.json({
      agendamentosHoje: agendamentosHoje.map(a => ({
        id: a.id,
        clientName: a.client.name,
        clientPhone: a.client.phone,
        professionalName: a.professional.name,
        services: a.services.map(s => s.service.name).join(', '),
        time: a.startTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
        }),
        totalPrice: Number(a.totalPrice),
        status: a.status,
      })),
      paymentsHoje: paymentsHoje.map((p) => ({
        id: p.id,
        client: p.appointment.client.name,
        service: p.appointment.services.map((s) => s.service.name).join(' + ') || '—',
        amount: Number(p.amount),
        method: p.method,
        paidAt: p.paidAt.toISOString(),
      })),
      kpis: {
        agendamentosHoje: agendamentosHoje.length,
        agendamentosMes,
        totalClientes,
        novosClientesMes,
        receitaMes: receitaTotal,
        despesaMes: despesaTotal,
        lucroMes: receitaTotal - despesaTotal,
        totalHoje,
        ticketMedio,
        completedHoje,
        pendentesHoje: agendamentosHoje.filter((a) =>
          ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status),
        ).length,
      },
      alerts,
    })
  } catch (err) {
    console.error('[REPORT_DASHBOARD_ERROR]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
