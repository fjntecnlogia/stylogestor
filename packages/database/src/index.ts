import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Singleton para não abrir múltiplas conexões em dev (hot reload)
export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

export * from '@prisma/client'

// ============================================================
// SYSTEM SETTINGS HELPERS
// ============================================================
// Camada fina sobre SystemSetting pra reuso entre apps.
// Pattern: getSetting<T>(key, fallback) sempre retorna T (nunca null).

/**
 * Lê uma config global do SaaS. Se a chave não existe, retorna o fallback.
 * Type-safe via generic.
 */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key } })
    if (!row) return fallback
    return row.value as T
  } catch {
    return fallback
  }
}

/**
 * Cria/atualiza uma config global. Upsert.
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value: value as never },
    update: { value: value as never },
  })
}

// Chaves bem conhecidas — concentradas aqui pra evitar typos
export const SETTING_KEYS = {
  DEFAULT_TRIAL_DAYS: 'default_trial_days',
} as const
