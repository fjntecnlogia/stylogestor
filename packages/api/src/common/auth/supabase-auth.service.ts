import { Injectable, Logger } from '@nestjs/common'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { CacheService } from '../cache/cache.service'

export interface SupabaseUserInfo {
  supabaseId: string
  email: string
  name?: string
}

/**
 * Valida JWT do Supabase Auth (usado pelos apps mobile).
 *
 * Estratégia: `auth.getUser(jwt)` valida o token via API do Supabase
 * (funciona com HS256 ou RS256/JWKS, independente da config do projeto).
 * Resultado é cacheado no Redis por 60s pra evitar 1 network call por request.
 *
 * Sem SUPABASE_URL/KEY no env → retorna null (Supabase auth desativado).
 */
@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name)
  private readonly client: SupabaseClient | null

  constructor(private readonly cache: CacheService) {
    const url = process.env.SUPABASE_URL
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!url || !key) {
      this.logger.warn('SUPABASE_URL/KEY ausentes — auth Supabase desativado')
      this.client = null
      return
    }
    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  get enabled(): boolean {
    return this.client !== null
  }

  /**
   * Valida o JWT e retorna info do user. null se inválido.
   * Cacheia o resultado positivo por 60s (chave = hash curto do token).
   */
  async verify(jwt: string): Promise<SupabaseUserInfo | null> {
    if (!this.client) return null

    // Cache: usa os últimos 16 chars do token como chave (suficiente p/ unicidade,
    // não expõe o token inteiro nos logs do Redis).
    const cacheKey = `auth:supabase:${jwt.slice(-16)}`
    const cached = await this.cache.getJSON<SupabaseUserInfo>(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await this.client.auth.getUser(jwt)
      if (error || !data.user || !data.user.email) {
        return null
      }
      const info: SupabaseUserInfo = {
        supabaseId: data.user.id,
        email: data.user.email,
        name:
          (data.user.user_metadata?.name as string | undefined) ||
          (data.user.user_metadata?.full_name as string | undefined),
      }
      await this.cache.setJSON(cacheKey, info, 60)
      return info
    } catch (err) {
      this.logger.warn(`Supabase getUser falhou: ${(err as Error).message}`)
      return null
    }
  }
}
