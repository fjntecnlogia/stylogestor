import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp, msgLembreteAgendamento } from '@/lib/whatsapp'
import { prisma } from '@stylogestor/database'

const INTERNAL_KEY = process.env.INTERNAL_API_KEY || 'stylo-internal-key-2026'

// POST /api/automations/reminders
// Chamado por um cron job todo dia às 18h para enviar lembretes do dia seguinte
export async function POST(req: NextRequest) {
  // Verificar chave interna
  const key = req.headers.get('x-internal-key')
  if (key !== INTERNAL_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Calcular data de amanhã
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)

    // Buscar agendamentos de amanhã que ainda não receberam lembrete
    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: tomorrow, lt: dayAfter },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        reminderSent: false,
      },
      include: {
        client:       { select: { name: true, phone: true, email: true } },
        professional: { select: { name: true } },
        tenant:       { select: { name: true } },
      },
    })

    const results = { sent: 0, failed: 0, total: appointments.length }

    for (const appt of appointments) {
      try {
        const date = new Date(appt.date).toLocaleDateString('pt-BR', {
          weekday: 'long', day: 'numeric', month: 'long',
        })
        const time = appt.startTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit', minute: '2-digit',
        })

        if (appt.client.phone) {
          const ok = await sendWhatsApp({
            phone: appt.client.phone,
            message: msgLembreteAgendamento({
              clientName: appt.client.name,
              date,
              time,
              barbershop: appt.tenant.name,
            }),
          })

          if (ok) {
            // Marcar como enviado
            await prisma.appointment.update({
              where: { id: appt.id },
              data: { reminderSent: true },
            })
            results.sent++
          } else {
            results.failed++
          }
        }
      } catch (err) {
        console.error('[REMINDER_ITEM_ERROR]', appt.id, err)
        results.failed++
      }
    }

    console.log('[REMINDERS_CRON]', results)
    return NextResponse.json({ ok: true, ...results })
  } catch (err) {
    console.error('[REMINDERS_ERROR]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
