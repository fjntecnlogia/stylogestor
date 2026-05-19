import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { readSettings } from '@/lib/tenant-settings'

/**
 * POST /api/v1/booking/[slug]/appointments
 *
 * Endpoint PÚBLICO — cliente final agenda pela landing pública.
 * Cria/reutiliza Client pelo telefone (chave única por tenant), cria
 * Appointment e respeita todas as validações: conflito, bloqueio,
 * horário de funcionamento, leadHours, maxDaysAhead.
 *
 * Body: { clientName, clientPhone, clientEmail?, serviceIds, professionalId,
 *         startISO, notes? }
 *
 * autoConfirmBooking (tenant.settings) controla o status final:
 *   true  → CONFIRMED (cliente garante o horário)
 *   false → SCHEDULED (gestor revisa antes de confirmar)
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, active: true, name: true, settings: true },
    })
    if (!tenant || !tenant.active) {
      return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })
    }
    const tenantId = tenant.id
    const settings = readSettings(tenant.settings)

    const body = await req.json()
    const {
      clientName, clientPhone, clientEmail,
      serviceIds, professionalId, startISO, notes,
    } = body as {
      clientName?: string; clientPhone?: string; clientEmail?: string
      serviceIds?: string[]; professionalId?: string
      startISO?: string; notes?: string
    }

    if (!clientName?.trim()) {
      return NextResponse.json({ error: 'Informe seu nome' }, { status: 400 })
    }
    if (!clientPhone?.trim()) {
      return NextResponse.json({ error: 'Informe seu telefone/WhatsApp' }, { status: 400 })
    }
    if (!professionalId) {
      return NextResponse.json({ error: 'Escolha um profissional' }, { status: 400 })
    }
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json({ error: 'Escolha ao menos um serviço' }, { status: 400 })
    }
    if (!startISO) {
      return NextResponse.json({ error: 'Escolha data e horário' }, { status: 400 })
    }

    const requestedStart = new Date(startISO)
    if (isNaN(requestedStart.getTime())) {
      return NextResponse.json({ error: 'Data/hora inválida' }, { status: 400 })
    }

    const nowWithTolerance = new Date(Date.now() - 60 * 1000)
    if (requestedStart < nowWithTolerance) {
      return NextResponse.json({ error: 'Não dá pra agendar no passado' }, { status: 400 })
    }

    // Lead time mínimo
    if (settings.bookingLeadHours > 0) {
      const earliest = new Date(Date.now() + settings.bookingLeadHours * 60 * 60 * 1000)
      if (requestedStart < earliest) {
        return NextResponse.json(
          { error: `Agendamento exige pelo menos ${settings.bookingLeadHours}h de antecedência.` },
          { status: 400 },
        )
      }
    }
    if (settings.maxBookingDaysAhead > 0) {
      const latest = new Date(Date.now() + settings.maxBookingDaysAhead * 24 * 60 * 60 * 1000)
      if (requestedStart > latest) {
        return NextResponse.json(
          { error: `Agendamento até ${settings.maxBookingDaysAhead} dias à frente.` },
          { status: 400 },
        )
      }
    }

    // Carrega profissional + serviços
    const [professional, services] = await Promise.all([
      prisma.professional.findFirst({ where: { id: professionalId, tenantId, active: true } }),
      prisma.service.findMany({ where: { id: { in: serviceIds }, tenantId, active: true } }),
    ])
    if (!professional) return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 })
    if (services.length === 0) return NextResponse.json({ error: 'Serviços inválidos' }, { status: 400 })

    const totalPrice = services.reduce((s, sv) => s + Number(sv.price), 0)
    const totalDuration = services.reduce((s, sv) => s + sv.duration, 0)
    const startTime = requestedStart
    const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000)

    // Validação BusinessSchedule (em BRT)
    const BR_OFFSET = -3 * 60 * 60 * 1000
    const startBR = new Date(startTime.getTime() + BR_OFFSET)
    const endBR = new Date(endTime.getTime() + BR_OFFSET)
    const dayOfWeek = startBR.getUTCDay()
    const pad2 = (n: number) => String(n).padStart(2, '0')
    const startHHmm = `${pad2(startBR.getUTCHours())}:${pad2(startBR.getUTCMinutes())}`
    const endHHmm = `${pad2(endBR.getUTCHours())}:${pad2(endBR.getUTCMinutes())}`

    const schedule = await prisma.businessSchedule.findFirst({
      where: { tenantId, dayOfWeek },
    })
    if (!schedule || !schedule.active) {
      return NextResponse.json(
        { error: `Esse dia está fechado. Escolha outro dia.` },
        { status: 400 },
      )
    }
    if (startHHmm < schedule.startTime || endHHmm > schedule.endTime) {
      return NextResponse.json(
        { error: `Horário fora do funcionamento (${schedule.startTime} às ${schedule.endTime}).` },
        { status: 400 },
      )
    }

    // Bloqueios do profissional
    const dateBR = startBR.toISOString().slice(0, 10)
    const blocks = await prisma.professionalBlock.findMany({
      where: {
        tenantId, professionalId,
        date: new Date(`${dateBR}T00:00:00.000Z`),
      },
    })
    for (const b of blocks) {
      if (b.type === 'full_day') {
        return NextResponse.json(
          { error: `${professional.name} não atende nesse dia.` },
          { status: 409 },
        )
      }
      if (b.type === 'interval' && b.startTime && b.endTime) {
        if (startHHmm < b.endTime && endHHmm > b.startTime) {
          return NextResponse.json(
            { error: `${professional.name} não atende entre ${b.startTime} e ${b.endTime} nesse dia.` },
            { status: 409 },
          )
        }
      }
    }

    // Check de conflito (com buffer)
    if (!settings.allowOverlapping) {
      const bufferMs = settings.defaultAppointmentBuffer * 60 * 1000
      const conflicting = await prisma.appointment.findFirst({
        where: {
          tenantId, professionalId,
          status: { notIn: ['CANCELED', 'NO_SHOW'] },
          startTime: { lt: new Date(endTime.getTime() + bufferMs) },
          endTime: { gt: new Date(startTime.getTime() - bufferMs) },
        },
      })
      if (conflicting) {
        return NextResponse.json(
          { error: 'Esse horário acabou de ser preenchido. Escolha outro.' },
          { status: 409 },
        )
      }
    }

    // Upsert cliente pelo telefone (chave natural). Se já existe pelo
    // mesmo phone+tenant, reusa; senão cria.
    const normPhone = clientPhone.replace(/\D/g, '')
    let client = await prisma.client.findFirst({
      where: { tenantId, phone: normPhone },
    })
    if (!client) {
      client = await prisma.client.create({
        data: {
          tenantId,
          name: clientName.trim(),
          phone: normPhone,
          email: clientEmail?.trim() || null,
          source: 'booking_public',
          active: true,
        },
      })
    } else {
      // Atualiza nome se mudou (cliente pode ter cadastrado errado antes)
      if (client.name !== clientName.trim()) {
        await prisma.client.update({
          where: { id: client.id },
          data: { name: clientName.trim() },
        })
      }
    }

    const status = settings.autoConfirmBooking ? 'CONFIRMED' : 'SCHEDULED'
    const created = await prisma.appointment.create({
      data: {
        tenantId,
        clientId: client.id,
        professionalId,
        date: startTime,
        startTime,
        endTime,
        status,
        totalPrice,
        totalDuration,
        notes: notes?.trim() || null,
        source: 'booking_public',
        services: {
          create: services.map((s) => ({
            serviceId: s.id,
            price: s.price,
            duration: s.duration,
          })),
        },
      },
    })

    return NextResponse.json({
      ok: true,
      id: created.id,
      status,
      startISO: startTime.toISOString(),
      message: status === 'CONFIRMED'
        ? `Agendamento confirmado pra ${startBR.toISOString().slice(0,10)} às ${startHHmm}.`
        : `Agendamento recebido! ${tenant.name} vai confirmar em breve.`,
    })
  } catch (err) {
    console.error('[BOOKING_APPT_POST_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao agendar' }, { status: 500 })
  }
}
