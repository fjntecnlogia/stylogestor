// ============================================================
// STYLOGESTOR — WhatsApp via Ultra MSG
// https://ultramsg.com/
// ============================================================

const ULTRA_INSTANCE = process.env.ULTRAMSG_INSTANCE || ''
const ULTRA_TOKEN    = process.env.ULTRAMSG_TOKEN    || ''
const ULTRA_BASE     = `https://api.ultramsg.com/${ULTRA_INSTANCE}`

interface SendMessageParams {
  phone: string
  message: string
}

export async function sendWhatsApp({ phone, message }: SendMessageParams): Promise<boolean> {
  if (!ULTRA_INSTANCE || !ULTRA_TOKEN) {
    console.warn('[ULTRAMSG] Credenciais não configuradas')
    return false
  }

  const cleaned = phone.replace(/\D/g, '')
  const number  = cleaned.startsWith('55') ? `+${cleaned}` : `+55${cleaned}`

  try {
    const body = new URLSearchParams({
      token: ULTRA_TOKEN,
      to: number,
      body: message,
      priority: '1',
    })

    const res = await fetch(`${ULTRA_BASE}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const data = await res.json()
    if (data.sent === 'true' || data.sent === true) return true

    console.error('[ULTRAMSG_ERROR]', data)
    return false
  } catch (err) {
    console.error('[ULTRAMSG_EXCEPTION]', err)
    return false
  }
}

// ── Templates ────────────────────────────────────────────────────

export function msgConfirmacaoAgendamento(p: {
  clientName: string; date: string; time: string
  service: string; professional: string; barbershop: string
}) {
  return `✂️ *Agendamento confirmado!*

Olá, ${p.clientName.split(' ')[0]}! Seu horário foi confirmado.

📅 *Data:* ${p.date}
🕐 *Horário:* ${p.time}
✂️ *Serviço:* ${p.service}
💈 *Profissional:* ${p.professional}
🏪 *Barbearia:* ${p.barbershop}

_Powered by STYLOGESTOR_ 🚀`
}

export function msgLembreteAgendamento(p: {
  clientName: string; date: string; time: string; barbershop: string
}) {
  return `⏰ *Lembrete de agendamento!*

Oi, ${p.clientName.split(' ')[0]}! Não esqueça do seu horário.

📅 *Data:* ${p.date}
🕐 *Horário:* ${p.time}
🏪 *Barbearia:* ${p.barbershop}

Até lá! ✂️`
}

export function msgAniversario(p: { clientName: string; barbershop: string }) {
  return `🎂 *Feliz aniversário, ${p.clientName.split(' ')[0]}!*

A equipe da ${p.barbershop} deseja um dia especial para você! 🎉

Temos um presente esperando por você. Venha nos visitar! ✂️`
}

export function msgFidelidade(p: {
  clientName: string; stamps: number; goal: number; reward: string
}) {
  const left = p.goal - p.stamps
  return `⭐ *Programa de Fidelidade*

Oi, ${p.clientName.split(' ')[0]}! Você tem *${p.stamps}/${p.goal}* carimbos.

${left > 0
  ? `Faltam *${left} visita${left > 1 ? 's' : ''}* para ganhar: *${p.reward}* 🎁`
  : `🎉 Você ganhou: *${p.reward}*! Resgate na próxima visita.`}

✂️ _STYLOGESTOR_`
}
