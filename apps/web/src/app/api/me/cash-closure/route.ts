import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getServerUser } from '@/lib/supabase/server'
import { getCurrentTenantId } from '@/lib/auth-tenant'

/**
 * Calcula o fechamento de um dia a partir das tabelas reais
 * (Payment + Transaction EXPENSE + Appointment).
 */
async function computeDayClosure(tenantId: string, dayStr: string) {
  const dayStart = new Date(`${dayStr}T00:00:00`)
  const dayEnd = new Date(`${dayStr}T23:59:59.999`)

  const [payments, expenses, appointments, professionals] = await Promise.all([
    prisma.payment.findMany({
      where: { appointment: { tenantId }, paidAt: { gte: dayStart, lte: dayEnd } },
      include: {
        appointment: { select: { professionalId: true, totalPrice: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { tenantId, type: 'EXPENSE', date: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.appointment.findMany({
      where: { tenantId, startTime: { gte: dayStart, lte: dayEnd } },
      select: { status: true, professionalId: true, totalPrice: true },
    }),
    prisma.professional.findMany({
      where: { tenantId },
      select: { id: true, name: true, commission: true },
    }),
  ])

  const totalIn = payments.reduce((s, p) => s + Number(p.amount), 0)
  const totalOut = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const completedAppts = appointments.filter((a) => a.status === 'COMPLETED')
  const cancelations = appointments.filter((a) => a.status === 'CANCELED').length

  // Por método de pagamento
  const byMethod: Record<string, number> = {}
  payments.forEach((p) => {
    byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount)
  })

  // Por profissional (faturado + comissão estimada)
  const byProfessional = professionals.map((prof) => {
    const myAppts = completedAppts.filter((a) => a.professionalId === prof.id)
    const faturado = myAppts.reduce((s, a) => s + Number(a.totalPrice), 0)
    const pct = Number(prof.commission ?? 0)
    const comissao = Math.round((faturado * pct) / 100)
    return { id: prof.id, name: prof.name, atendimentos: myAppts.length, faturado, comissao, pct }
  }).filter((p) => p.atendimentos > 0) // só inclui quem atendeu

  const totalCommissions = byProfessional.reduce((s, p) => s + p.comissao, 0)

  return {
    totalIn,
    totalOut,
    net: totalIn - totalOut,
    appointments: completedAppts.length,
    cancelations,
    byMethod,
    byProfessional,
    totalCommissions,
  }
}

/**
 * GET /api/me/cash-closure?date=YYYY-MM-DD
 *
 * Retorna o fechamento já feito do dia OU os totais calculados (preview)
 * se ainda não foi fechado. Response sempre tem `closed: boolean`.
 */
export async function GET(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const dayStr = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  const dayDate = new Date(`${dayStr}T00:00:00`)

  try {
    const existing = await prisma.cashClosure.findUnique({
      where: { tenantId_date: { tenantId, date: dayDate } },
    })

    if (existing) {
      return NextResponse.json({
        closed: true,
        id: existing.id,
        date: dayStr,
        totalIn: Number(existing.totalIn),
        totalOut: Number(existing.totalOut),
        net: Number(existing.net),
        appointments: existing.appointments,
        cancelations: existing.cancelations,
        byMethod: existing.byMethod,
        byProfessional: existing.byProfessional,
        totalCommissions: Number(existing.totalCommissions),
        closedAt: existing.closedAt.toISOString(),
        notes: existing.notes ?? '',
      })
    }

    // Preview — calcula em runtime, não persiste
    const preview = await computeDayClosure(tenantId, dayStr)
    return NextResponse.json({ closed: false, date: dayStr, ...preview })
  } catch (err) {
    console.error('[CASH_CLOSURE_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar fechamento' }, { status: 500 })
  }
}

/**
 * POST /api/me/cash-closure
 * Body: { date?: 'YYYY-MM-DD' (default: hoje), notes?: string }
 *
 * Fecha o caixa: cria CashClosure imutável com snapshot do dia.
 * Idempotente: se já existe pra data, retorna o existente (sem erro).
 */
export async function POST(req: NextRequest) {
  const user = await getServerUser()
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const body = await req.json().catch(() => ({}))
    const dayStr = (body as { date?: string })?.date ?? new Date().toISOString().slice(0, 10)
    const notes = (body as { notes?: string })?.notes
    const dayDate = new Date(`${dayStr}T00:00:00`)

    // Idempotência: já fechado?
    const existing = await prisma.cashClosure.findUnique({
      where: { tenantId_date: { tenantId, date: dayDate } },
    })
    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyClosed: true,
        id: existing.id,
        closedAt: existing.closedAt.toISOString(),
      })
    }

    const totals = await computeDayClosure(tenantId, dayStr)

    const created = await prisma.cashClosure.create({
      data: {
        tenantId,
        date: dayDate,
        totalIn: totals.totalIn,
        totalOut: totals.totalOut,
        net: totals.net,
        appointments: totals.appointments,
        cancelations: totals.cancelations,
        byMethod: totals.byMethod,
        byProfessional: totals.byProfessional,
        totalCommissions: totals.totalCommissions,
        closedByClerkId: user?.id ?? null,
        notes: notes?.trim() || null,
      },
    })

    return NextResponse.json({
      ok: true,
      id: created.id,
      closedAt: created.closedAt.toISOString(),
      ...totals,
    })
  } catch (err) {
    console.error('[CASH_CLOSURE_POST_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao fechar caixa' }, { status: 500 })
  }
}
