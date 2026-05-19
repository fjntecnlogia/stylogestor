import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

/**
 * Converte um Date pra HH:mm.
 */
function toHHmm(d: Date): string {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/**
 * Combina data ISO (YYYY-MM-DD) + hora HH:mm num DateTime UTC.
 * O servidor armazena em UTC; a UI lida com horário local.
 */
function combineDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`)
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
    discount: 0, // mantemos sempre 0 no shape; desconto será aplicado via Payment futuramente
    payMethod: a.payments[0]?.method ?? '',
    start: toHHmm(a.startTime),
    end: toHHmm(a.endTime),
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
    const dateParam = req.nextUrl.searchParams.get('date')
    const dayStr = dateParam ?? new Date().toISOString().slice(0, 10)
    const dayStart = new Date(`${dayStr}T00:00:00`)
    const dayEnd = new Date(`${dayStr}T23:59:59.999`)

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
    const { clientId, professionalId, serviceIds, date, time, notes } = body as {
      clientId?: string; professionalId?: string; serviceIds?: string[]
      date?: string; time?: string; notes?: string
    }

    if (!clientId || !professionalId || !date || !time) {
      return NextResponse.json(
        { error: 'clientId, professionalId, date e time são obrigatórios' },
        { status: 400 },
      )
    }
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json({ error: 'Pelo menos um serviço é obrigatório' }, { status: 400 })
    }

    // Validação anti-agendamento-no-passado (defesa em profundidade —
    // a UI já bloqueia, mas client validation pode ser burlada).
    // Tolerância de 1 minuto pra latência de rede + clock skew.
    const requestedStart = new Date(`${date}T${time}:00`)
    const nowWithTolerance = new Date(Date.now() - 60 * 1000)
    if (requestedStart < nowWithTolerance) {
      return NextResponse.json(
        { error: 'Não é possível agendar em horário no passado' },
        { status: 400 },
      )
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

    const startTime = combineDateTime(date, time)
    const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000)

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
