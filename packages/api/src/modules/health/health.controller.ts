import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../../common/prisma/prisma.service'
import { Public } from '../../common/decorators/public.decorator'

/**
 * Health check pra monitores externos (UptimeRobot, BetterStack, Pingdom...).
 *
 * - GET /api/v1/health   → readiness check (DB + app)
 * - GET /api/v1/health/live → liveness (só app responde, sem checagens externas)
 *
 * Status codes:
 *   200 → tudo OK
 *   503 → algo crítico está fora (DB inacessível)
 *
 * Cuidados:
 *   - @Public (sem JWT) — monitores não autenticam
 *   - Não vaza informação sensível em erro (só "db_unreachable", não a string de erro)
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Readiness check — pronto pra receber tráfego?
   * Checa banco também. Use ESSE no UptimeRobot.
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async check() {
    const checks: Record<string, 'ok' | 'fail'> = {}

    // 1. DB
    try {
      await this.prisma.$queryRaw`SELECT 1`
      checks.db = 'ok'
    } catch {
      checks.db = 'fail'
    }

    const allOk = Object.values(checks).every((v) => v === 'ok')
    if (!allOk) {
      throw new ServiceUnavailableException({
        status: 'degraded',
        checks,
        timestamp: new Date().toISOString(),
      })
    }

    return {
      status: 'ok',
      checks,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Liveness check — o processo está vivo?
   * Não checa dependências externas. Use pra orquestrador (K8s/PM2) detectar
   * que precisa restartar o processo.
   */
  @Public()
  @Get('live')
  @HttpCode(HttpStatus.OK)
  live() {
    return {
      status: 'alive',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }
  }
}
