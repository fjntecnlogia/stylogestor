// ============================================================
// STYLOGESTOR — WhatsApp via Z-API
// https://developer.z-api.io/
// ============================================================

const ZAPI_INSTANCE    = process.env.ZAPI_INSTANCE_ID    || ''
const ZAPI_TOKEN       = process.env.ZAPI_TOKEN           || ''
const ZAPI_CLIENT_TOKEN= process.env.ZAPI_CLIENT_TOKEN    || ''
const ZAPI_BASE        = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}`

interface SendMessageParams {
  phone: string   // qualquer formato — limpamos aqui
  message: string
}

export async function sendWhatsApp({ phone, message }: SendMessageParams): Promise<boolean> {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN) {
    console.warn('[ZAPI] Credenciais não configuradas — mensagem não enviada')
    return false
  }

  const cleaned = phone.replace(/\D/g, '')
  const number  = cleaned.startsWith('55') ? cleaned : `55${cleaned}`

  try {
    const res = await fetch(`${ZAPI_BASE}/send-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ZAPI_CLIENT_TOKEN ? { 'Client-Token': ZAPI_CLIENT_TOKEN } : {}),
      },
      body: JSON.stringify({ phone: number, message }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[ZAPI_ERROR]', res.status, err)
      return false
    }

    return true
  } catch (err) {
    console.error('[ZAPI_EXCEPTION]', err)
    return false
  }
}

// ── Templates de mensagem ────────────────────────────────────────

export function msgConfirmacaoAgendamento(params: {
  clientName: string
  date: string
  time: string
  service: string
  professional: string
  barbershop: string
}) {
  return `✂️ *Agendamento confirmado!*

Olá, ${params.clientName.split(' ')[0]}! Seu horário foi confirmado.

📅 *Data:* ${params.date}
🕐 *Horário:* ${params.time}
✂️ *Serviço:* ${params.service}
💈 *Profissional:* ${params.professional}
🏪 *Barbearia:* ${params.barbershop}

Para cancelar, entre em contato com a barbearia.

_Powered by STYLOGESTOR_ 🚀`
}

export function msgLembreteAgendamento(params: {
  clientName: string
  date: string
  time: string
  barbershop: string
}) {
  return `⏰ *Lembrete de agendamento!*

Oi, ${params.clientName.split(' ')[0]}! Não esqueça do seu horário.

📅 *Data:* ${params.date}
🕐 *Horário:* ${params.time}
🏪 *Barbearia:* ${params.barbershop}

Até lá! ✂️`
}

export function msgAniversario(params: { clientName: string; barbershop: string }) {
  return `🎂 *Feliz aniversário, ${params.clientName.split(' ')[0]}!*

A equipe da ${params.barbershop} deseja um dia especial para você! 🎉

Temos uma oferta exclusiva esperando por você. Venha nos visitar! ✂️

_STYLOGESTOR_`
}

export function msgFidelidade(params: {
  clientName: string; stamps: number; goal: number; reward: string
}) {
  const left = params.goal - params.stamps
  return `⭐ *Programa de Fidelidade*

Oi, ${params.clientName.split(' ')[0]}! Você tem *${params.stamps}/${params.goal}* carimbos.

${left > 0
  ? `Faltam *${left} visita${left > 1 ? 's' : ''}* para ganhar: *${params.reward}* 🎁`
  : `🎉 Você ganhou: *${params.reward}*! Resgate na próxima visita.`}

✂️ _STYLOGESTOR_`
}
