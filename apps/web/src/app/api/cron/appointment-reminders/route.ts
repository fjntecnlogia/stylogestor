import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { sendWhatsApp, msgLembreteAgendamento } from '@/lib/whatsapp'

/**
 * GET /api/cron/appointment-reminders
 *
 * Job HORÁRIO — busca agendamentos que estão entre 23 e 25 horas no futuro
 * (janela de ±1h) e dispara WhatsApp de lembrete pro cliente.
 *
 * Idempotência via campo Appointment.reminderSent — depois de enviar,
 * marcamos true e nunca mais dispara pra esse appointment. Cron pode
 * rodar de hora em hora sem duplicar mensagens.
 *
 * Proteção: header X-Cron-Secret obrigatório (mesmo padrão do trial-warnings).
 *
 * Pra agendar (na VPS):
 *   crontab -e
 *   0 * * * * curl -fsS -H "X-Cron-Secret: $CRON_SECRET" https://app.stylogestor.com.br/api/cron/appointment-reminders >> /var/log/stylogestor-cron.log 2>&1
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = Date.now()
  // Janela: 23h ~ 25h no futuro. Margem cobre cron rodando de hora em hora
  // sem perder appointments. reminderSent garante idempotência.
  const windowStart = new Date(now + 23 * 60 * 60 * 1000)
  const windowEnd = new Date(now + 25 * 60 * 60 * 1000)

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: { gte: windowStart, lte: windowEnd },
        status: { notIn: ['CANCELED', 'NO_SHOW', 'COMPLETED'] },
        reminderSent: false,
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        professional: { select: { name: true } },
        tenant: { select: { id: true, name: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    })

    let sent = 0
    let failed = 0
    let skipped = 0

    for (const apt of appointments) {
      // Sem telefone, não dá pra mandar (skipped)
      if (!apt.client.phone) { skipped++; continue }

      const dateStr = apt.startTime.toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long',
        timeZone: 'America/Sao_Paulo',
      })
      const timeStr = apt.startTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
      })
      const message = msgLembreteAgendamento({
        clientName: apt.client.name,
        date: dateStr,
        time: timeStr,
        barbershop: apt.tenant.name,
      })

      try {
        const ok = await sendWhatsApp({ phone: apt.client.phone, message })
        if (ok) {
          // Marca como enviado pra não duplicar em runs seguintes
          await prisma.appointment.update({
            where: { id: apt.id },
            data: { reminderSent: true },
          })
          sent++
        } else {
          failed++
        }
      } catch (err) {
        console.error(`[APT_REMINDER_ERROR] appointment=${apt.id}`, err)
        failed++
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date(now).toISOString(),
      window: { from: windowStart.toISOString(), to: windowEnd.toISOString() },
      candidates: appointments.length,
      sent,
      failed,
      skipped,
    })
  } catch (err) {
    console.error('[APT_REMINDER_CRON_ERROR]', err)
    return NextResponse.json({ error: 'Erro no cron' }, { status: 500 })
  }
}
