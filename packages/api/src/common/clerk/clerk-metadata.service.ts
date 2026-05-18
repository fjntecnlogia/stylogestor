import { Injectable, Logger } from '@nestjs/common'
import { createClerkClient } from '@clerk/backend'

interface SubscriptionMetadata {
  subscriptionStatus: string
  plan?: string
  stripeSubId?: string
}

/**
 * Helper pra atualizar `publicMetadata` do usuário no Clerk.
 *
 * Por quê:
 *   O middleware do Next.js (`apps/web/src/middleware.ts`) lê
 *   `sessionClaims.metadata.subscriptionStatus` pra bloquear acesso
 *   de usuários com assinatura cancelada/inadimplente. Sem atualizar
 *   esse metadata, o middleware deixa passar mesmo após cancelamento.
 *
 *   O webhook do Next.js HOJE faz esse update via `clerk.users.updateUserMetadata`.
 *   Quando migrarmos 100% pra NestJS (Fase 2B), esse service assume o papel.
 */
@Injectable()
export class ClerkMetadataService {
  private readonly logger = new Logger(ClerkMetadataService.name)
  private readonly clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  })

  /**
   * Atualiza publicMetadata.subscriptionStatus (+ plan + stripeSubId opcionais).
   * Não joga erro se Clerk falhar — apenas loga. Billing é prioridade,
   * Clerk metadata é "side-effect" desejável mas não crítico.
   */
  async updateSubscription(
    clerkUserId: string,
    data: SubscriptionMetadata,
  ): Promise<{ ok: boolean }> {
    if (!process.env.CLERK_SECRET_KEY) {
      this.logger.warn('CLERK_SECRET_KEY ausente — pulando update do metadata')
      return { ok: false }
    }

    try {
      await this.clerkClient.users.updateUserMetadata(clerkUserId, {
        publicMetadata: {
          subscriptionStatus: data.subscriptionStatus,
          ...(data.plan && { plan: data.plan }),
          ...(data.stripeSubId && { stripeSubId: data.stripeSubId }),
        },
      })
      this.logger.log(
        `Clerk metadata: clerkId=${clerkUserId} status=${data.subscriptionStatus} plan=${data.plan ?? '-'}`,
      )
      return { ok: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'erro desconhecido'
      // ERRO mas não joga — billing já foi gravado no DB, isso é só sync
      this.logger.error(`Falha ao atualizar Clerk metadata (clerkId=${clerkUserId}): ${msg}`)
      return { ok: false }
    }
  }
}
