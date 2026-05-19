import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

/**
 * GET /api/me/cash-closure/history?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=30
 *
 * Lista os últimos fechamentos do tenant, do mais recente pro mais antigo.
 * Default: últimos 30. Use ?from/?to pra filtrar por janela.
 */
export async function GET(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const url = req.nextUrl
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 30), 365)

  try {
    const closures = await prisma.cashClosure.findMany({
      where: {
        tenantId,
        ...(from ? { date: { gte: new Date(`${from}T00:00:00`) } } : {}),
        ...(to ? { date: { lte: new Date(`${to}T23:59:59.999`) } } : {}),
      },
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json(
      closures.map((c) => ({
        id: c.id,
        date: c.date.toISOString().slice(0, 10),
        totalIn: Number(c.totalIn),
        totalOut: Number(c.totalOut),
        net: Number(c.net),
        appointments: c.appointments,
        cancelations: c.cancelations,
        byMethod: c.byMethod,
        byProfessional: c.byProfessional,
        totalCommissions: Number(c.totalCommissions),
        closedAt: c.closedAt.toISOString(),
        notes: c.notes ?? '',
      })),
    )
  } catch (err) {
    console.error('[CASH_CLOSURE_HISTORY_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}
