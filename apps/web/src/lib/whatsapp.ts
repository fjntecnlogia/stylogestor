const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'stylo-whatsapp-key-2026'
const INSTANCE     = process.env.EVOLUTION_INSTANCE || 'stylogestor'

interface SendMessageParams {
  phone: string   // formato: 5511999999999
  message: string
}

export async function sendWhatsApp({ phone, message }: SendMessageParams) {
  try {
    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    })
    if (!res.ok) {
      console.error('[WHATSAPP_ERROR]', await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[WHATSAPP_ERROR]', err)
    return false
  }
}

// Templates de mensagem
export const WA_TEMPLATES = {
  confirmacao: (nome: string, servico: string, data: string, hora: string, barbearia: string) =>
    `✅ *Agendamento confirmado!*\n\nOlá ${nome}! Seu horário foi marcado com sucesso.\n\n📋 *${servico}*\n📅 ${data} às ${hora}\n📍 ${barbearia}\n\nAté lá! 😊\n\n_STYLOGESTOR_`,

  lembrete: (nome: string, servico: string, hora: string) =>
    `⏰ *Lembrete de agendamento*\n\nOlá ${nome}! Você tem um horário hoje às *${hora}*.\n\n✂️ ${servico}\n\nNos vemos em breve! 💈\n\n_STYLOGESTOR_`,

  cancelamento: (nome: string, data: string, hora: string) =>
    `❌ *Agendamento cancelado*\n\nOlá ${nome}! Seu agendamento de ${data} às ${hora} foi cancelado.\n\nPara reagendar, acesse o link da barbearia.\n\n_STYLOGESTOR_`,

  cobranca: (nome: string, valor: string, link: string) =>
    `💳 *Pagamento pendente*\n\nOlá ${nome}! Sua assinatura STYLOGESTOR de *R$ ${valor}* está vencida.\n\nRegularize agora para não perder acesso: ${link}\n\n_STYLOGESTOR_`,
}
