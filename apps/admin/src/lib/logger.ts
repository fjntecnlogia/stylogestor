/**
 * Logger central — espelho do helper que existe no `apps/web/src/lib/logger.ts`.
 *
 * O admin e o web são apps Next.js separados (cada um com seu build/deploy),
 * mas escrevem na MESMA tabela `system_logs` do PostgreSQL — então os logs
 * de ambos aparecem juntos no painel do admin.
 *
 * Por que não compartilhar via package? Pra evitar criar um package só pra
 * isso. Dois arquivos pequenos e idênticos é menos overhead que mais um
 * workspace pra resolver no monorepo.
 */

import { prisma } from '@stylogestor/database'

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogPayload {
  level: LogLevel
  source: string
  message: string
  context?: Record<string, unknown> | null
  tenantId?: string | null
}

export async function logEvent(payload: LogPayload): Promise<void> {
  const { level, source, message, context, tenantId } = payload

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
    console.error('[LOGGER] Falha ao gravar SystemLog:', err)
  }
}

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
