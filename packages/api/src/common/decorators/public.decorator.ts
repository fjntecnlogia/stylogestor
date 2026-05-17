import { SetMetadata } from '@nestjs/common'

/**
 * Marca uma rota como pública (sem ClerkAuthGuard).
 * Usar SOMENTE em endpoints intencionalmente abertos: webhooks, healthchecks, planos.
 */
export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
