import { Injectable, Logger } from '@nestjs/common'

export interface SendEmailResult {
  ok: boolean
  error?: string
  id?: string
}

interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

/**
 * Cliente Resend (https://resend.com) pra emails transacionais.
 *
 * Templates portados de apps/web/src/lib/resend.ts. Quando o webhook do
 * Stripe migrar 100% pra NestJS (Fase 2B), os emails saem daqui.
 *
 * Sem RESEND_API_KEY no .env → loga warn e retorna ok:false (não quebra
 * fluxo de billing).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)

  private readonly apiKey = process.env.RESEND_API_KEY
  private readonly fromEmail =
    process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@stylogestor.com.br'
  private readonly fromName = process.env.RESEND_FROM_NAME || 'STYLOGESTOR'
  private readonly appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'

  /**
   * Envia email via Resend HTTP API.
   * Sem dep de SDK pra evitar peso extra (fetch é nativo no Node 18+).
   */
  private async send(payload: EmailPayload): Promise<SendEmailResult> {
    if (!this.apiKey) {
      this.logger.warn('RESEND_API_KEY não configurado — email não enviado')
      return { ok: false, error: 'resend_not_configured' }
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: Array.isArray(payload.to) ? payload.to : [payload.to],
          subject: payload.subject,
          html: payload.html,
          reply_to: payload.replyTo,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        this.logger.error(`Resend HTTP ${res.status}: ${errText}`)
        return { ok: false, error: `http_${res.status}` }
      }

      const body = (await res.json()) as { id?: string }
      return { ok: true, id: body.id }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'erro desconhecido'
      this.logger.error(`Resend exception: ${msg}`)
      return { ok: false, error: msg }
    }
  }

  // ── Templates ───────────────────────────────────────────────────

  private baseTemplate(content: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>STYLOGESTOR</title>
<style>
  body { font-family: Arial, sans-serif; background: #F9FAFB; margin: 0; padding: 20px; color: #1C1C2E; }
  .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: #1A3A6B; padding: 28px 32px; text-align: center; }
  .logo { font-size: 22px; font-weight: 900; color: white; letter-spacing: -1px; }
  .logo span { color: #F5A623; }
  .body { padding: 32px; }
  .footer { background: #F3F4F6; padding: 20px 32px; text-align: center; font-size: 12px; color: #6B7280; }
  .btn { display: inline-block; background: #1A3A6B; color: white !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; text-decoration: none; margin: 20px 0; }
  .highlight { background: #F0F4FF; border-radius: 10px; padding: 16px 20px; margin: 16px 0; border-left: 4px solid #1A3A6B; }
  h2 { color: #1A3A6B; margin-top: 0; }
  p { line-height: 1.6; color: #374151; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">STYLO<span>GESTOR</span></div>
    <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0">Sistema de Gestão para Barbearias e Salões</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    © ${new Date().getFullYear()} STYLOGESTOR · <a href="https://stylogestor.com.br" style="color:#1A3A6B">stylogestor.com.br</a><br>
    Você recebeu este email por estar cadastrado no STYLOGESTOR.
  </div>
</div>
</body>
</html>`
  }

  /** Boas-vindas com trial (14 dias por padrão) */
  sendWelcome(to: string, name: string, trialDays = 14) {
    const first = name.split(' ')[0]
    return this.send({
      to,
      subject: `🎉 Bem-vindo ao STYLOGESTOR, ${first}!`,
      html: this.baseTemplate(`
        <h2>Seja bem-vindo, ${first}! 🎉</h2>
        <p>Sua conta foi criada com sucesso. Você tem <strong>${trialDays} dias gratuitos</strong> para explorar tudo que o STYLOGESTOR oferece.</p>
        <div class="highlight">
          <strong>✨ O que você pode fazer agora:</strong><br>
          ✓ Configurar sua barbearia e horários<br>
          ✓ Cadastrar profissionais e serviços<br>
          ✓ Ativar o link de agendamento online<br>
          ✓ Controlar seu financeiro e estoque
        </div>
        <a href="${this.appUrl}/dashboard" class="btn">Acessar meu painel →</a>
        <p style="font-size:13px;color:#6B7280;">Em caso de dúvidas, fale com nosso suporte pelo WhatsApp: <strong>(65) 99695-2828</strong></p>
      `),
    })
  }

  /** Trial expirando em N dias */
  sendTrialExpiring(to: string, name: string, daysLeft: number) {
    const first = name.split(' ')[0]
    const plural = daysLeft > 1 ? 's' : ''
    return this.send({
      to,
      subject: `⏰ Seu trial expira em ${daysLeft} dia${plural} — STYLOGESTOR`,
      html: this.baseTemplate(`
        <h2>Seu período gratuito está acabando!</h2>
        <p>Olá, ${first}! Faltam apenas <strong>${daysLeft} dia${plural}</strong> para seu trial expirar.</p>
        <div class="highlight">
          <strong>🚀 Assine agora e não perca nada:</strong><br>
          ✓ Plano Pro: R$ 149/mês · até 5 profissionais<br>
          ✓ 100% online · cancele quando quiser<br>
          ✓ Suporte humanizado incluído
        </div>
        <a href="${this.appUrl}/planos" class="btn">Ver planos e assinar →</a>
      `),
    })
  }

  /** Cobrança falhou — usuário precisa atualizar pagamento */
  sendPaymentFailed(to: string, name: string, amount: string) {
    const first = name.split(' ')[0]
    return this.send({
      to,
      subject: '⚠️ Problema no pagamento — STYLOGESTOR',
      html: this.baseTemplate(`
        <h2>Problema no pagamento</h2>
        <p>Olá, ${first}! Houve um problema ao processar seu pagamento de <strong>${amount}</strong>.</p>
        <div class="highlight" style="border-left-color:#EF4444;background:#FEF2F2;">
          ⚠️ Sua conta ficará suspensa em breve caso o pagamento não seja regularizado.
        </div>
        <a href="${this.appUrl}/planos" class="btn" style="background:#EF4444;">Regularizar pagamento →</a>
        <p style="font-size:13px;color:#6B7280;">Dúvidas? WhatsApp: <strong>(65) 99695-2828</strong></p>
      `),
    })
  }

  /** Confirmação de agendamento — usado pelo módulo de appointments */
  sendAppointmentConfirmation(
    to: string,
    clientName: string,
    date: string,
    time: string,
    service: string,
    professional: string,
    barbershop: string,
  ) {
    const first = clientName.split(' ')[0]
    return this.send({
      to,
      subject: `✅ Agendamento confirmado — ${barbershop}`,
      html: this.baseTemplate(`
        <h2>Agendamento confirmado! ✂️</h2>
        <p>Olá, ${first}! Seu agendamento foi confirmado com sucesso.</p>
        <div class="highlight">
          <strong>📅 Detalhes do agendamento:</strong><br>
          📆 Data: <strong>${date}</strong><br>
          🕐 Horário: <strong>${time}</strong><br>
          ✂️ Serviço: <strong>${service}</strong><br>
          💈 Profissional: <strong>${professional}</strong><br>
          🏪 Barbearia: <strong>${barbershop}</strong>
        </div>
        <p style="font-size:13px;color:#6B7280;">Para cancelar, entre em contato com a barbearia com pelo menos 2 horas de antecedência.</p>
      `),
    })
  }
}
