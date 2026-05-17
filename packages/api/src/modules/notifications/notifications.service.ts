import { Injectable, Logger } from '@nestjs/common'

export interface SendResult {
  ok: boolean
  error?: string
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)
  private readonly evolutionUrl = process.env.EVOLUTION_API_URL
  private readonly evolutionKey = process.env.EVOLUTION_API_KEY
  private readonly instance = process.env.EVOLUTION_INSTANCE_NAME ?? 'stylogestor'

  /**
   * Mascara telefone para logs/respostas: mantém só DDD + últimos 2 dígitos.
   * "11987654321" → "11****21"
   */
  private static maskPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 4) return '****'
    const ddd = cleaned.slice(0, 2)
    const tail = cleaned.slice(-2)
    return `${ddd}****${tail}`
  }

  async sendWhatsApp(phone: string, message: string): Promise<SendResult> {
    if (!this.evolutionUrl || !this.evolutionKey) {
      this.logger.warn('Evolution API não configurada — mensagem não enviada')
      return { ok: false, error: 'evolution_not_configured' }
    }

    const cleaned = phone.replace(/\D/g, '')
    const number = cleaned.startsWith('55') ? cleaned : `55${cleaned}`
    const masked = NotificationsService.maskPhone(phone)

    try {
      const res = await fetch(
        `${this.evolutionUrl}/message/sendText/${this.instance}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.evolutionKey,
          },
          body: JSON.stringify({ number, text: message }),
        },
      )
      if (!res.ok) {
        this.logger.error(`WhatsApp falhou: status=${res.status} phone=${masked}`)
        return { ok: false, error: `http_${res.status}` }
      }
      return { ok: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'erro desconhecido'
      this.logger.error(`Erro ao enviar WhatsApp (phone=${masked}): ${msg}`)
      return { ok: false, error: msg }
    }
  }

  confirmationMessage(clientName: string, date: Date, professionalName: string): string {
    const d = date.toLocaleDateString('pt-BR')
    const h = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return (
      `✂️ *Agendamento confirmado!*\n\n` +
      `Olá, ${clientName}! Seu agendamento foi confirmado.\n\n` +
      `📅 *Data:* ${d}\n` +
      `🕐 *Horário:* ${h}\n` +
      `💈 *Profissional:* ${professionalName}\n\n` +
      `Qualquer dúvida, nos chame aqui mesmo. Te esperamos! 😊`
    )
  }

  reminderMessage(clientName: string, date: Date): string {
    const h = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return (
      `⏰ *Lembrete de amanhã!*\n\n` +
      `Oi, ${clientName}! Lembrando que você tem horário *amanhã às ${h}*.\n\n` +
      `Até lá! ✂️`
    )
  }
}
