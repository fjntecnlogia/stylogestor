import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp, msgConfirmacaoAgendamento, msgLembreteAgendamento } from '@/lib/whatsapp'
import { sendAppointmentConfirmationEmail } from '@/lib/resend'

// POST /api/automations/appointment
// Disparado quando um agendamento é criado/confirmado
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, appointment } = body

    // Validar dados mínimos
    if (!appointment?.clientPhone && !appointment?.clientEmail) {
      return NextResponse.json({ error: 'clientPhone ou clientEmail obrigatório' }, { status: 400 })
    }

    const results: Record<string, boolean> = {}

    // ── Confirmação de agendamento ───────────────────────────────
    if (type === 'confirmation' || type === 'created') {
      const date = new Date(appointment.date).toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      const time = appointment.time ?? new Date(appointment.startTime).toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit',
      })

      // WhatsApp
      if (appointment.clientPhone) {
        results.whatsapp = await sendWhatsApp({
          phone: appointment.clientPhone,
          message: msgConfirmacaoAgendamento({
            clientName:   appointment.clientName   ?? 'Cliente',
            date,
            time,
            service:      appointment.serviceName  ?? 'Serviço',
            professional: appointment.professionalName ?? 'Profissional',
            barbershop:   appointment.barbershopName  ?? 'Barbearia',
          }),
        })
      }

      // Email
      if (appointment.clientEmail) {
        results.email = await sendAppointmentConfirmationEmail(
          appointment.clientEmail,
          appointment.clientName   ?? 'Cliente',
          date,
          time,
          appointment.serviceName  ?? 'Serviço',
          appointment.professionalName ?? 'Profissional',
          appointment.barbershopName   ?? 'Barbearia',
        )
      }
    }

    // ── Lembrete (D-1) ──────────────────────────────────────────
    if (type === 'reminder') {
      const date = new Date(appointment.date).toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
      const time = appointment.time ?? new Date(appointment.startTime).toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit',
      })

      if (appointment.clientPhone) {
        results.whatsapp = await sendWhatsApp({
          phone: appointment.clientPhone,
          message: msgLembreteAgendamento({
            clientName:  appointment.clientName ?? 'Cliente',
            date,
            time,
            barbershop:  appointment.barbershopName ?? 'Barbearia',
          }),
        })
      }
    }

    // ── Cancelamento ────────────────────────────────────────────
    if (type === 'canceled') {
      if (appointment.clientPhone) {
        results.whatsapp = await sendWhatsApp({
          phone: appointment.clientPhone,
          message: `❌ *Agendamento cancelado*\n\nOlá, ${appointment.clientName?.split(' ')[0] ?? 'Cliente'}!\n\nSeu agendamento em *${appointment.barbershopName ?? 'nossa barbearia'}* foi cancelado.\n\nPara remarcar, acesse o link de agendamento ou entre em contato conosco.\n\n_STYLOGESTOR_ ✂️`,
        })
      }
    }

    console.log('[AUTOMATION]', type, results)
    return NextResponse.json({ ok: true, type, results })
  } catch (err) {
    console.error('[AUTOMATION_ERROR]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
