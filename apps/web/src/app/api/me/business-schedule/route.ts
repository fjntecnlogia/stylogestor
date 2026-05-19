import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

/**
 * GET /api/me/business-schedule
 * Retorna horários de funcionamento da barbearia.
 * Sempre devolve os 7 dias (preenche com defaults se algum dia não existir
 * no banco), pra UI ficar mais simples.
 */
export async function GET() {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const schedules = await prisma.businessSchedule.findMany({
      where: { tenantId },
      orderBy: { dayOfWeek: 'asc' },
    })

    // Mapa por dia → preenche os 7 dias da semana
    const byDay = new Map(schedules.map((s) => [s.dayOfWeek, s]))
    const result = Array.from({ length: 7 }, (_, day) => {
      const existing = byDay.get(day)
      return {
        day,
        start: existing?.startTime ?? '09:00',
        end: existing?.endTime ?? '18:00',
        active: existing?.active ?? (day >= 1 && day <= 5), // seg-sex default
      }
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[BUSINESS_SCHEDULE_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar horários' }, { status: 500 })
  }
}

interface ScheduleInput {
  day: number
  start: string
  end: string
  active: boolean
}

/**
 * PUT /api/me/business-schedule
 * Body: { schedules: [{ day, start, end, active }] }
 *
 * Substitui completamente os horários da barbearia. Operação atômica
 * (deleta tudo + recria). Garante consistência: sem dias órfãos.
 */
export async function PUT(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const schedules = (body as { schedules?: unknown })?.schedules
    if (!Array.isArray(schedules)) {
      return NextResponse.json({ error: 'schedules deve ser um array' }, { status: 400 })
    }

    // Validação básica
    const valid: ScheduleInput[] = []
    for (const s of schedules) {
      if (
        typeof s?.day === 'number' && s.day >= 0 && s.day <= 6 &&
        typeof s?.start === 'string' && /^\d{2}:\d{2}$/.test(s.start) &&
        typeof s?.end === 'string' && /^\d{2}:\d{2}$/.test(s.end) &&
        typeof s?.active === 'boolean'
      ) {
        valid.push({ day: s.day, start: s.start, end: s.end, active: s.active })
      }
    }
    if (valid.length === 0) {
      return NextResponse.json({ error: 'Nenhum horário válido enviado' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.businessSchedule.deleteMany({ where: { tenantId } }),
      prisma.businessSchedule.createMany({
        data: valid.map((s) => ({
          tenantId,
          dayOfWeek: s.day,
          startTime: s.start,
          endTime: s.end,
          active: s.active,
        })),
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[BUSINESS_SCHEDULE_PUT_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao salvar horários' }, { status: 500 })
  }
}
