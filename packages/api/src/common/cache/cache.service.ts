import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'

/**
 * Wrapper de Redis para cache + rate limit.
 *
 * - Sem REDIS_URL no env: opera em modo no-op (não cacheia, nada quebra).
 * - Erros do Redis NÃO derrubam request: log + cache miss fallback.
 *
 * Estrutura de chaves:
 *   cache:plans                  → lista de planos (raramente muda)
 *   cache:tenant:slug:<slug>     → resolução slug→tenant (middleware)
 *   throttle:tenant:<tenantId>   → contador de rate limit por tenant
 *
 * TTLs por método (definidos no caller).
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name)
  private readonly client: Redis | null

  constructor() {
    const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL
    if (!url) {
      this.logger.warn('REDIS_URL ausente — cache desativado (modo no-op)')
      this.client = null
      return
    }
    this.client = new Redis(url, {
      // Robustez: nunca derrubar app por problema de cache
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
      // Upstash usa TLS (rediss://). ioredis detecta automaticamente.
      // Em caso de falha, log mas não throw
      reconnectOnError: () => true,
    })
    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`)
    })
    this.client.on('connect', () => {
      this.logger.log('Redis conectado')
    })
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit()
  }

  /** Pega valor parseado como JSON. Retorna null se ausente ou falhar. */
  async getJSON<T>(key: string): Promise<T | null> {
    if (!this.client) return null
    try {
      const raw = await this.client.get(key)
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch (err) {
      this.logger.warn(`cache miss (erro): ${key} — ${(err as Error).message}`)
      return null
    }
  }

  /** Salva JSON com TTL em segundos. */
  async setJSON<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.client) return
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch (err) {
      this.logger.warn(`cache set falhou: ${key} — ${(err as Error).message}`)
    }
  }

  /** Apaga chave (ou prefix). Útil pra invalidar cache após mudanças. */
  async del(key: string): Promise<void> {
    if (!this.client) return
    try {
      await this.client.del(key)
    } catch (err) {
      this.logger.warn(`cache del falhou: ${key} — ${(err as Error).message}`)
    }
  }

  /**
   * Incrementa contador atômico com TTL. Usado pra rate limit.
   * Retorna o novo valor após incremento. Primeira chamada cria com TTL.
   *
   * Se Redis estiver fora, retorna 0 (= permite a request — fail open).
   */
  async incrWithTTL(key: string, ttlSeconds: number): Promise<number> {
    if (!this.client) return 0
    try {
      // Pipeline: incr + expire only-if-not-set (NX em SET TTL é complexo,
      // mais simples: usar EXPIRE NX se ttl ainda não foi setado)
      const pipeline = this.client.multi()
      pipeline.incr(key)
      pipeline.expire(key, ttlSeconds, 'NX') // NX = só seta se não tinha TTL
      const results = await pipeline.exec()
      if (!results || !results[0]) return 0
      const [err, value] = results[0]
      if (err) {
        this.logger.warn(`rate limit incr falhou: ${(err as Error).message}`)
        return 0
      }
      return typeof value === 'number' ? value : Number(value)
    } catch (err) {
      this.logger.warn(`rate limit incr exception: ${(err as Error).message}`)
      return 0
    }
  }

  /** Acesso direto ao cliente (uso avançado). null se cache desativado. */
  get raw(): Redis | null {
    return this.client
  }
}
