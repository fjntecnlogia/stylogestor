import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'
import { readSettings } from '@/lib/tenant-settings'

/**
 * Converte Date pra HH:mm no timezone do BR.
 * O server pode estar rodando em UTC (VPS Hostinger). Sem o timeZone
 * explícito, o user vê o horário UTC em vez do horário dele.
 */
function toHHmm(d: Date, tz = 'America/Sao_Paulo'): string {
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
  })
}

/**
 * Shape achatado pra compat com o frontend (que usava AppointmentFixture).
 */
function shape(a: {
  id: string; professionalId: string; clientId: string
  client: { name: string; phone: string } | null
  professional: { name: string } | null
  services: Array<{ service: { name: string }; price: unknown; duration: number }>
  startTime: Date; endTime: Date
  status: string; totalPrice: unknown; totalDuration: number
  notes: string | null
  payments: Array<{ method: string }>
}) {
  return {
    id: a.id,
    professionalId: a.professionalId,
    clientId: a.clientId,
    client: a.client?.name ?? '(cliente removido)',
    phone: a.client?.phone ?? '',
    professional: a.professional?.name ?? '',
    service: a.services.map((s) => s.service.name).join(' + ') || '—',
    serviceIds: a.services.map((s) => (s as unknown as { serviceId: string }).serviceId),
    price: Number(a.totalPrice ?? 0),
    discount: 0,
    payMethod: a.payments[0]?.method ?? '',
    start: toHHmm(a.startTime),
    end: toHHmm(a.endTime),
    // ISOs UTC pro frontend formatar localmente quando precisar
    startISO: a.startTime.toISOString(),
    endISO: a.endTime.toISOString(),
    status: a.status,
    duration: a.totalDuration,
    note: a.notes ?? '',
  }
}

/**
 * GET /api/appointments?date=YYYY-MM-DD
 * Lista agendamentos do dia (ou de hoje se date não vier).
 */
export async function GET(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    // Preferimos fromISO/toISO (janela explícita do dia no fuso do cliente).
    // Fallback pro `date` legacy — mas calculado em América/São Paulo
    // pra não pegar UTC quando o servidor roda UTC.
    const url = req.nextUrl
    const fromISO = url.searchParams.get('fromISO')
    const toISO = url.searchParams.get('toISO')

    let dayStart: Date
    let dayEnd: Date
    if (fromISO && toISO) {
      dayStart = new Date(fromISO)
      dayEnd = new Date(toISO)
    } else {
      // Legacy: ?date=YYYY-MM-DD. Assume BRT (-03) pra alinhar com gestor BR.
      const dayStr = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
      dayStart = new Date(`${dayStr}T00:00:00-03:00`)
      dayEnd = new Date(`${dayStr}T23:59:59.999-03:00`)
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { startTime: 'asc' },
      include: {
        client: { select: { name: true, phone: true } },
        professional: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
        payments: { select: { method: true } },
      },
    })

    return NextResponse.json(appointments.map(shape))
  } catch (err) {
    console.error('[APPOINTMENTS_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 })
  }
}

/**
 * POST /api/appointments
 * Body: { clientId, professionalId, serviceIds[], date: 'YYYY-MM-DD', time: 'HH:mm', notes? }
 *
 * Calcula totalPrice/totalDuration a partir dos serviços + endTime = start + duration.
 */
export async function POST(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const { clientId, professionalId, serviceIds, date, time, startISO, notes } = body as {
      clientId?: string; professionalId?: string; serviceIds?: string[]
      date?: string; time?: string; startISO?: string; notes?: string
    }

    if (!clientId || !professionalId) {
      return NextResponse.json(
        { error: 'clientId e professionalId são obrigatórios' },
        { status: 400 },
      )
    }
    if (!startISO && (!date || !time)) {
      return NextResponse.json(
        { error: 'startISO (ou date + time) são obrigatórios' },
        { status: 400 },
      )
    }
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json({ error: 'Pelo menos um serviço é obrigatório' }, { status: 400 })
    }

    // Preferimos o ISO completo enviado pelo client (já em UTC, sem
    // ambiguidade de timezone). Fallback: date+time interpretados em BRT
    // (-03) pra não pegar UTC quando server roda UTC.
    const requestedStart = startISO
      ? new Date(startISO)
      : new Date(`${date}T${time}:00-03:00`)
    if (isNaN(requestedStart.getTime())) {
      return NextResponse.json({ error: 'Data/hora inválida' }, { status: 400 })
    }

    // Validação anti-agendamento-no-passado (defesa em profundidade —
    // a UI já bloqueia, mas client validation pode ser burlada).
    // Tolerância de 1 minuto pra latência de rede + clock skew.
    const nowWithTolerance = new Date(Date.now() - 60 * 1000)
    if (requestedStart < nowWithTolerance) {
      return NextResponse.json(
        { error: 'Não é possível agendar em horário no passado' },
        { status: 400 },
      )
    }

    // Lê settings do tenant ANTES de validar (precisamos pra leadHours, etc)
    const tenantSettingsRow = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })
    const settings = readSettings(tenantSettingsRow?.settings)

    // bookingLeadHours: antecedência mínima. Ex: 2h significa que não dá
    // pra agendar pra daqui 1h. Útil pra dar tempo de preparar.
    if (settings.bookingLeadHours > 0) {
      const earliest = new Date(Date.now() + settings.bookingLeadHours * 60 * 60 * 1000)
      if (requestedStart < earliest) {
        return NextResponse.json(
          {
            error: `Agendamento exige no mínimo ${settings.bookingLeadHours}h de antecedência. Escolha um horário após ${earliest.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}.`,
          },
          { status: 400 },
        )
      }
    }

    // maxBookingDaysAhead: limite no futuro. Ex: 60 dias = não agenda 90 dias depois.
    if (settings.maxBookingDaysAhead > 0) {
      const latest = new Date(Date.now() + settings.maxBookingDaysAhead * 24 * 60 * 60 * 1000)
      if (requestedStart > latest) {
        return NextResponse.json(
          {
            error: `Agendamento limitado a ${settings.maxBookingDaysAhead} dias à frente. Escolha até ${latest.toLocaleDateString('pt-BR')}.`,
          },
          { status: 400 },
        )
      }
    }

    // Confirma que client + professional + services pertencem ao tenant
    const [client, professional, services] = await Promise.all([
      prisma.client.findFirst({ where: { id: clientId, tenantId } }),
      prisma.professional.findFirst({ where: { id: professionalId, tenantId } }),
      prisma.service.findMany({ where: { id: { in: serviceIds }, tenantId } }),
    ])
    if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    if (!professional) return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 })
    if (services.length === 0) return NextResponse.json({ error: 'Nenhum serviço válido' }, { status: 400 })

    const totalPrice = services.reduce((s, sv) => s + Number(sv.price), 0)
    const totalDuration = services.reduce((s, sv) => s + sv.duration, 0)

    const startTime = requestedStart
    const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000)

    // Validação contra horário de funcionamento (BusinessSchedule).
    // Pega dayOfWeek e HH:mm interpretados em BRT (server pode estar UTC).
    // BRT = UTC-3 (sem DST desde 2019). Adicionamos -3h e usamos getUTC* pra
    // extrair valores "como visto pelo BR".
    const BR_OFFSET = -3 * 60 * 60 * 1000
    const startBR = new Date(startTime.getTime() + BR_OFFSET)
    const endBR = new Date(endTime.getTime() + BR_OFFSET)
    const dayOfWeek = startBR.getUTCDay() // 0=Dom, 6=Sáb
    const pad2 = (n: number) => String(n).padStart(2, '0')
    const startHHmm = `${pad2(startBR.getUTCHours())}:${pad2(startBR.getUTCMinutes())}`
    const endHHmm = `${pad2(endBR.getUTCHours())}:${pad2(endBR.getUTCMinutes())}`

    const schedule = await prisma.businessSchedule.findFirst({
      where: { tenantId, dayOfWeek },
    })
    if (!schedule || !schedule.active) {
      const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
      return NextResponse.json(
        {
          error: `A barbearia não funciona na ${dayNames[dayOfWeek]}-feira. Configure os horários em Configurações → Horários.`,
        },
        { status: 400 },
      )
    }
    // Horários do schedule também são HH:mm — comparação lexicográfica funciona
    if (startHHmm < schedule.startTime || endHHmm > schedule.endTime) {
      return NextResponse.json(
        {
          error: `Horário fora do funcionamento. Hoje a barbearia atende das ${schedule.startTime} às ${schedule.endTime}. O agendamento começaria às ${startHHmm} e terminaria ${endHHmm}.`,
        },
        { status: 400 },
      )
    }

    // Detecção de conflito de horário do mesmo profissional. Inclui o
    // BUFFER configurado nas settings (ex: buffer=15min impede que outro
    // atendimento comece menos de 15min depois do anterior terminar).
    if (!settings.allowOverlapping) {
      const bufferMs = settings.defaultAppointmentBuffer * 60 * 1000
      const conflictStart = new Date(startTime.getTime() - bufferMs)
      const conflictEnd = new Date(endTime.getTime() + bufferMs)

      const conflicting = await prisma.appointment.findFirst({
        where: {
          tenantId,
          professionalId,
          status: { notIn: ['CANCELED', 'NO_SHOW'] },
          startTime: { lt: conflictEnd },
          endTime: { gt: conflictStart },
        },
        include: {
          client: { select: { name: true } },
        },
      })
      if (conflicting) {
        const cStart = toHHmm(conflicting.startTime)
        const cEnd = toHHmm(conflicting.endTime)
        const bufferNote = settings.defaultAppointmentBuffer > 0
          ? ` (com buffer de ${settings.defaultAppointmentBuffer}min entre atendimentos)`
          : ''
        return NextResponse.json(
          {
            error: `Conflito de horário${bufferNote}: ${professional.name} já tem ${conflicting.client?.name ?? 'outro cliente'} entre ${cStart} e ${cEnd}. Pra permitir sobreposição, ative em Configurações → Meu negócio.`,
            conflict: {
              clientName: conflicting.client?.name,
              start: cStart,
              end: cEnd,
            },
          },
          { status: 409 },
        )
      }
    }

    const created = await prisma.appointment.create({
      data: {
        tenantId,
        clientId,
        professionalId,
        date: startTime,
        startTime,
        endTime,
        status: 'SCHEDULED',
        totalPrice,
        totalDuration,
        notes: notes?.trim() || null,
        services: {
          create: services.map((s) => ({
            serviceId: s.id,
            price: s.price,
            duration: s.duration,
          })),
        },
      },
      include: {
        client: { select: { name: true, phone: true } },
        professional: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
        payments: { select: { method: true } },
      },
    })

    return NextResponse.json(shape(created))
  } catch (err) {
    console.error('[APPOINTMENTS_POST_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 })
  }
}
