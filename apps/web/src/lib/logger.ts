/**
 * Logger central da aplicação — grava em `system_logs` + console.
 *
 * Por que log no banco?
 *   - Painel admin lista eventos importantes (criação de tenant, erros
 *     em cron, resgate de código) sem precisar SSH + grep em PM2.
 *   - Persistente mesmo se o processo PM2 reiniciar.
 *   - Filtrável por level/source/tenant.
 *
 * Por que console também?
 *   - Erros em devtime + ainda visível em `pm2 logs` na VPS.
 *   - Se o INSERT no banco falhar (ex.: DB fora do ar), não perdemos
 *     o evento — vai pro log do PM2 mesmo assim.
 *
 * NÃO chame em loops apertados — cria uma linha por log. Pra cron/admin
 * que rodam por minuto/hora está OK.
 */

import { prisma } from '@stylogestor/database'

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogPayload {
  level: LogLevel
  source: string // ex.: 'api/tenants', 'cron/reminders'
  message: string
  context?: Record<string, unknown> | null
  tenantId?: string | null
}

/**
 * Grava um log. Nunca lança — falha de log NÃO derruba a request.
 * Aguarde com `await` se quiser garantir persistência antes de seguir
 * (raro — normalmente é fire-and-forget).
 */
export async function logEvent(payload: LogPayload): Promise<void> {
  const { level, source, message, context, tenantId } = payload

  // Console primeiro — garante visibilidade mesmo se INSERT falhar
  const tag = `[${level.toUpperCase()}] ${source}`
  if (level === 'error') {
    console.error(tag, message, context ?? '')
  } else if (level === 'warn') {
    console.warn(tag, message, context ?? '')
  } else {
    console.log(tag, message, context ?? '')
  }

  try {
    await prisma.systemLog.create({
      data: {
        level,
        source,
        message,
        context: context ? (context as unknown as object) : undefined,
        tenantId: tenantId ?? null,
      },
    })
  } catch (err) {
    // Log falhou — não propaga. Só anota no console que o INSERT pifou.
    console.error('[LOGGER] Falha ao gravar SystemLog:', err)
  }
}

/** Atalhos por nível, mesma assinatura sem o campo level. */
export const log = {
  info: (source: string, message: string, context?: Record<string, unknown>, tenantId?: string) =>
    logEvent({ level: 'info', source, message, context, tenantId }),
  warn: (source: string, message: string, context?: Record<string, unknown>, tenantId?: string) =>
    logEvent({ level: 'warn', source, message, context, tenantId }),
  error: (source: string, message: string, context?: Record<string, unknown>, tenantId?: string) =>
    logEvent({ level: 'error', source, message, context, tenantId }),
  debug: (source: string, message: string, context?: Record<string, unknown>, tenantId?: string) =>
    logEvent({ level: 'debug', source, message, context, tenantId }),
}
