import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)
  private readonly evolutionUrl = process.env.EVOLUTION_API_URL
  private readonly evolutionKey = process.env.EVOLUTION_API_KEY
  private readonly instance = process.env.EVOLUTION_INSTANCE_NAME ?? 'stylogestor'

  async sendWhatsApp(phone: string, message: string): Promise<void> {
    if (!this.evolutionUrl || !this.evolutionKey) {
      this.logger.warn('Evolution API não configurada — mensagem não enviada')
      return
    }

    const cleaned = phone.replace(/\D/g, '')
    const number = cleaned.startsWith('55') ? cleaned : `55${cleaned}`

    try {
      const res = await fetch(
        `${this.evolutionUrl}/message/sendText/${this.instance}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.evolutionKey,
          },
          body: JSON.stringify({
            number,
            text: message,
          }),
        },
      )
      if (!res.ok) {
        this.logger.error(`WhatsApp falhou: ${res.status} — ${phone}`)
      }
    } catch (err) {
      this.logger.error(`Erro ao enviar WhatsApp: ${err}`)
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
