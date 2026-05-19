import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

type AppointmentStatus =
  | 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'

const VALID_STATUSES = new Set<AppointmentStatus>([
  'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'NO_SHOW',
])

type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'OTHER'

/** Mapa do display (PT-BR usado na UI) pro enum do schema. */
function normalizePayMethod(raw: string): PaymentMethod {
  const map: Record<string, PaymentMethod> = {
    'pix': 'PIX',
    'dinheiro': 'CASH',
    'cash': 'CASH',
    'cartão': 'CREDIT_CARD',
    'cartao': 'CREDIT_CARD',
    'credito': 'CREDIT_CARD',
    'crédito': 'CREDIT_CARD',
    'debito': 'DEBIT_CARD',
    'débito': 'DEBIT_CARD',
    'transferencia': 'TRANSFER',
    'transferência': 'TRANSFER',
  }
  return map[raw.toLowerCase()] ?? 'OTHER'
}

/**
 * PATCH /api/appointments/[id]
 * Body: { status?, payMethod?, notes? }
 *
 * Atualiza o agendamento. Quando status muda pra COMPLETED com payMethod,
 * registra um Payment. Quando muda pra CANCELED, salva cancelReason no notes
 * se mencionado.
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const { id } = await ctx.params
  const owned = await prisma.appointment.findFirst({
    where: { id, tenantId },
    select: { id: true, totalPrice: true, professionalId: true, clientId: true },
  })
  if (!owned) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const { status, payMethod, notes } = body as {
      status?: AppointmentStatus; payMethod?: string; notes?: string
    }

    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
      },
      include: {
        client: { select: { name: true, phone: true } },
        professional: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
        payments: { select: { method: true } },
      },
    })

    // Se virou COMPLETED + payMethod informado → cria Payment.
    // (Idempotente — só cria se ainda não existe Payment pra esse appointment)
    if (status === 'COMPLETED' && payMethod) {
      const existing = await prisma.payment.findFirst({ where: { appointmentId: id } })
      if (!existing) {
        await prisma.payment.create({
          data: {
            appointmentId: id,
            amount: owned.totalPrice,
            method: normalizePayMethod(payMethod),
          },
        })
        // Atualiza o cliente: totalVisits++, totalSpent += amount, lastVisit = now
        await prisma.client.update({
          where: { id: owned.clientId },
          data: {
            totalVisits: { increment: 1 },
            totalSpent: { increment: owned.totalPrice },
            lastVisit: new Date(),
          },
        })
      }
    }

    return NextResponse.json({
      id: updated.id,
      professionalId: updated.professionalId,
      clientId: updated.clientId,
      client: updated.client?.name ?? '',
      phone: updated.client?.phone ?? '',
      service: updated.services.map((s) => s.service.name).join(' + ') || '—',
      price: Number(updated.totalPrice),
      discount: 0,
      payMethod: payMethod ?? updated.payments[0]?.method ?? '',
      start: updated.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      end: updated.endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: updated.status,
      duration: updated.totalDuration,
      note: updated.notes ?? '',
    })
  } catch (err) {
    console.error('[APPOINTMENT_PATCH_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const { id } = await ctx.params
  const owned = await prisma.appointment.findFirst({ where: { id, tenantId } })
  if (!owned) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })

  try {
    // Cascade via schema (AppointmentService tem onDelete: Cascade).
    await prisma.appointment.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[APPOINTMENT_DELETE_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao excluir agendamento' }, { status: 500 })
  }
}
