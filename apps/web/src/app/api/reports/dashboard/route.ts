import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@stylogestor/database'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const tenantUser = await prisma.tenantUser.findFirst({
      where: { user: { clerkId: userId }, active: true },
    })
    if (!tenantUser) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

    const tenantId = tenantUser.tenantId
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

    const [
      agendamentosHoje,
      agendamentosMes,
      totalClientes,
      receitaMes,
      despesaMes,
      novosClientesMes,
    ] = await Promise.all([
      prisma.appointment.findMany({
        where: { tenantId, date: { gte: hoje, lt: amanha }, status: { notIn: ['CANCELED', 'NO_SHOW'] } },
        include: {
          client:       { select: { name: true, phone: true } },
          professional: { select: { name: true } },
          services:     { include: { service: { select: { name: true } } } },
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
    ])

    const receitaTotal = Number(receitaMes._sum.amount ?? 0)
    const despesaTotal = Number(despesaMes._sum.amount ?? 0)

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
        time: a.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        totalPrice: Number(a.totalPrice),
        status: a.status,
      })),
      kpis: {
        agendamentosHoje: agendamentosHoje.length,
        agendamentosMes,
        totalClientes,
        novosClientesMes,
        receitaMes: receitaTotal,
        despesaMes: despesaTotal,
        lucroMes: receitaTotal - despesaTotal,
      },
      alerts,
    })
  } catch (err) {
    console.error('[REPORT_DASHBOARD_ERROR]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
