import { Injectable, Logger } from '@nestjs/common'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseAppMetadata {
  role?: string
  subscriptionStatus?: string
  tenantSlug?: string
  tenantName?: string
  plan?: string
  stripeSubId?: string
  // Painéis do barbeiro (setados pelo futuro endpoint de invite, com role:'barbeiro').
  professionalId?: string
  professionalName?: string
}

/**
 * Escreve `app_metadata` no usuário do Supabase — os claims que o middleware do
 * web lê do JWT (`role`, `subscriptionStatus`, `tenantSlug`). Espelha o
 * `ClerkMetadataService` (que faz o mesmo no `publicMetadata` do Clerk).
 *
 * ⚠️ Usa **`app_metadata`**, NÃO `user_metadata`: app_metadata só é gravável
 * pela `service_role` e NÃO é editável pelo usuário → seguro pra autorização.
 * O Supabase faz MERGE shallow das chaves passadas (o que não vier fica intacto).
 *
 * Requer `SUPABASE_SERVICE_ROLE_KEY` (a `anon` não faz admin). Sem ela → no-op
 * (apenas warn). Nunca lança: metadata é side-effect; billing/onboarding já
 * gravaram no banco.
 */
@Injectable()
export class SupabaseMetadataService {
  private readonly logger = new Logger(SupabaseMetadataService.name)
  private readonly admin: SupabaseClient | null

  constructor() {
    const url = process.env.SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRole) {
      this.logger.warn(
        'SUPABASE_SERVICE_ROLE_KEY ausente — sync de app_metadata desativado (no-op)',
      )
      this.admin = null
      return
    }
    this.admin = createClient(url, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  get enabled(): boolean {
    return this.admin !== null
  }

  /**
   * Faz merge dos campos em `app_metadata`. `supabaseId` ausente (ex.: usuário
   * só-Clerk) → no-op. Ignora chaves undefined/null pra não sobrescrever.
   */
  async setAppMetadata(
    supabaseId: string | null | undefined,
    data: SupabaseAppMetadata,
  ): Promise<{ ok: boolean }> {
    if (!this.admin || !supabaseId) return { ok: false }

    const appMetadata: Record<string, string> = {}
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && v !== null) appMetadata[k] = String(v)
    }
    if (Object.keys(appMetadata).length === 0) return { ok: false }

    try {
      const { error } = await this.admin.auth.admin.updateUserById(supabaseId, {
        app_metadata: appMetadata,
      })
      if (error) throw new Error(error.message)
      this.logger.log(
        `Supabase app_metadata: supabaseId=${supabaseId} keys=${Object.keys(appMetadata).join(',')}`,
      )
      return { ok: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'erro desconhecido'
      this.logger.error(
        `Falha ao atualizar app_metadata (supabaseId=${supabaseId}): ${msg}`,
      )
      return { ok: false }
    }
  }

  /** Conveniência pro fluxo de assinatura (espelha ClerkMetadataService). */
  updateSubscription(
    supabaseId: string | null | undefined,
    data: { subscriptionStatus: string; plan?: string; stripeSubId?: string },
  ): Promise<{ ok: boolean }> {
    return this.setAppMetadata(supabaseId, data)
  }
}
