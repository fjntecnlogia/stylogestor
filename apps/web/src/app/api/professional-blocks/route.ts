import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'
import { getServerUser } from '@/lib/supabase/server'

/**
 * Helpers pra descobrir qual profissional o user logado é
 * (caso barbeiro queira ver/criar SÓ os seus bloqueios).
 * professionalId vem do app_metadata do JWT Supabase.
 */
async function currentProfessionalId(tenantId: string): Promise<string | null> {
  const user = await getServerUser()
  const profId = (user?.app_metadata as { professionalId?: string } | undefined)?.professionalId
  if (!profId) return null
  const owned = await prisma.professional.findFirst({ where: { id: profId, tenantId } })
  return owned?.id ?? null
}

function shape(b: {
  id: string; professionalId: string; date: Date
  type: string; startTime: string | null; endTime: string | null
  reason: string; createdAt: Date
}) {
  return {
    id: b.id,
    professionalId: b.professionalId,
    date: b.date.toISOString().slice(0, 10),
    type: b.type,
    startTime: b.startTime ?? undefined,
    endTime: b.endTime ?? undefined,
    reason: b.reason,
    createdAt: b.createdAt.toISOString(),
  }
}

/**
 * GET /api/professional-blocks?professionalId=&from=&to=
 *
 * Lista bloqueios. Se professionalId não vier, retorna do user atual
 * (se for barbeiro). Gestor pode listar de qualquer profissional do tenant.
 */
export async function GET(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const url = req.nextUrl
  let professionalId = url.searchParams.get('professionalId')
  const fromParam = url.searchParams.get('from')
  const toParam = url.searchParams.get('to')

  // Se não vier no query, tenta pegar do user (barbeiro vendo só os seus)
  if (!professionalId) {
    professionalId = await currentProfessionalId(tenantId)
  }

  try {
    const blocks = await prisma.professionalBlock.findMany({
      where: {
        tenantId,
        ...(professionalId ? { professionalId } : {}),
        ...(fromParam ? { date: { gte: new Date(`${fromParam}T00:00:00`) } } : {}),
        ...(toParam ? { date: { lte: new Date(`${toParam}T23:59:59.999`) } } : {}),
      },
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(blocks.map(shape))
  } catch (err) {
    console.error('[PROF_BLOCKS_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar bloqueios' }, { status: 500 })
  }
}

/**
 * POST /api/professional-blocks
 * Body: { professionalId?, date: 'YYYY-MM-DD', type: 'full_day'|'interval',
 *         startTime?, endTime?, reason }
 *
 * Se professionalId não vier, usa o do user logado (barbeiro). Útil pro
 * painel /profissional/horarios criar a folga do próprio barbeiro.
 */
export async function POST(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    let { professionalId } = body as { professionalId?: string }
    const { date, type, startTime, endTime, reason } = body as {
      date?: string; type?: 'full_day' | 'interval'
      startTime?: string; endTime?: string; reason?: string
    }

    if (!professionalId) {
      professionalId = (await currentProfessionalId(tenantId)) ?? undefined
    }
    if (!professionalId) {
      return NextResponse.json({ error: 'professionalId é obrigatório' }, { status: 400 })
    }
    if (!date || !type || !reason?.trim()) {
      return NextResponse.json({ error: 'date, type e reason são obrigatórios' }, { status: 400 })
    }
    if (type !== 'full_day' && type !== 'interval') {
      return NextResponse.json({ error: 'type deve ser full_day ou interval' }, { status: 400 })
    }
    if (type === 'interval' && (!startTime || !endTime)) {
      return NextResponse.json({ error: 'startTime e endTime obrigatórios pra type=interval' }, { status: 400 })
    }

    // Confirma que professional pertence ao tenant
    const owned = await prisma.professional.findFirst({ where: { id: professionalId, tenantId } })
    if (!owned) return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 })

    const created = await prisma.professionalBlock.create({
      data: {
        tenantId,
        professionalId,
        date: new Date(`${date}T00:00:00`),
        type,
        startTime: type === 'interval' ? startTime : null,
        endTime: type === 'interval' ? endTime : null,
        reason: reason.trim(),
      },
    })
    return NextResponse.json(shape(created))
  } catch (err) {
    console.error('[PROF_BLOCKS_POST_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao criar bloqueio' }, { status: 500 })
  }
}
