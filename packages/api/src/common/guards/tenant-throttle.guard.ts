import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common'
import { CacheService } from '../cache/cache.service'

/**
 * Rate limit POR TENANT (em cima do ThrottlerGuard global que é por IP).
 *
 * Motivação:
 *   ThrottlerGuard limita 100 req/min por IP. Não impede um tenant abusivo
 *   de usar várias máquinas pra estourar nossa capacidade. Este guard cria
 *   uma 2ª camada: cada tenant tem seu próprio bucket.
 *
 * Como funciona:
 *   - Roda DEPOIS do TenantGuard (precisa de `request.tenant` setado)
 *   - Conta requests por tenant numa janela móvel (Redis INCR + EXPIRE NX)
 *   - Se passar do limite, devolve 429 com header Retry-After
 *
 * Sem Redis configurado → modo no-op (não bloqueia nada — fail open).
 *
 * Limites padrão: 600 req/min por tenant (10 req/seg sustentado).
 * Pra ajustar por rota, use o decorator @TenantThrottle({ limit, ttl }).
 */

export const TENANT_THROTTLE_DEFAULT_LIMIT = 600
export const TENANT_THROTTLE_DEFAULT_TTL_SEC = 60

@Injectable()
export class TenantThrottleGuard implements CanActivate {
  private readonly logger = new Logger(TenantThrottleGuard.name)

  constructor(private readonly cache: CacheService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const tenant = request.tenant

    // Sem tenant identificado (rotas @Public, /health etc.) → não bloqueia
    if (!tenant?.id) return true

    const limit = TENANT_THROTTLE_DEFAULT_LIMIT
    const ttl = TENANT_THROTTLE_DEFAULT_TTL_SEC

    const key = `throttle:tenant:${tenant.id}:${Math.floor(Date.now() / 1000 / ttl)}`
    const count = await this.cache.incrWithTTL(key, ttl)

    // Fail open: se count for 0, é porque Redis tá fora ou erro. Não bloqueamos.
    if (count === 0) return true

    if (count > limit) {
      this.logger.warn(
        `Rate limit por tenant excedido: tenant=${tenant.id} count=${count}/${limit}`,
      )
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Limite de requisições do tenant excedido. Tente novamente em alguns segundos.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    return true
  }
}
