import { Injectable, NotFoundException } from '@nestjs/common'
import { CacheService } from '../../common/cache/cache.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { UpdateTenantDto } from './dto/update-tenant.dto'

// Cache de 5 min pra resolução slug→tenant.
// Trade-off: se tenant for desativado ou renomeado, mudança demora até 5min
// pra refletir em produção. Aceitável — desativações são raras e podemos
// invalidar manualmente após updates.
const SLUG_CACHE_TTL_SECONDS = 300

export interface CachedTenantPublic {
  id: string
  name: string
  plan: string
  slug: string
  logo: string | null
}

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private slugCacheKey(slug: string) {
    return `cache:tenant:slug:${slug}`
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { schedules: true, subscription: true },
    })
    if (!tenant) throw new NotFoundException('Tenant não encontrado')
    return tenant
  }

  /**
   * Busca pública (chamada pelo middleware Next.js a cada request de subdomínio).
   * Retorna apenas campos seguros — NUNCA expor settings/email/phone.
   *
   * Cacheado em Redis por 5min (cache miss falls back pra DB sem erro).
   */
  async findBySlugPublic(slug: string): Promise<CachedTenantPublic | null> {
    const cacheKey = this.slugCacheKey(slug)

    // 1. Tentar cache primeiro
    const cached = await this.cache.getJSON<CachedTenantPublic>(cacheKey)
    if (cached) return cached

    // 2. Fallback DB
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug, active: true },
      select: { id: true, name: true, plan: true, slug: true, logo: true },
    })

    // 3. Cachear resposta (mesmo se null — evita stampede no DB com slugs inexistentes)
    if (tenant) {
      await this.cache.setJSON(cacheKey, tenant, SLUG_CACHE_TTL_SECONDS)
    } else {
      // Negative cache: 1min pra slugs inexistentes (evita abuso/brute-force)
      await this.cache.setJSON(cacheKey, null, 60)
    }

    return tenant
  }

  /**
   * Update por ID — usa updateMany com filtro composto (id) para garantir que
   * a contagem de linhas afetadas seja explícita (NotFound se 0).
   * Invalida cache do slug se houver match.
   */
  async update(id: string, dto: UpdateTenantDto) {
    const updated = await this.prisma.tenant.updateMany({
      where: { id, active: true },
      data: dto,
    })
    if (updated.count === 0) {
      throw new NotFoundException('Tenant não encontrado')
    }
    const fresh = await this.findById(id)
    // Invalidar cache do slug (se houver) — mudou logo/name/plan visíveis
    await this.cache.del(this.slugCacheKey(fresh.slug))
    return fresh
  }

  async getDashboardStats(tenantId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [todayAppointments, todayRevenue, monthClients, totalClients] =
      await Promise.all([
        this.prisma.appointment.count({
          where: { tenantId, date: { gte: today, lt: tomorrow } },
        }),
        this.prisma.transaction.aggregate({
          where: {
            tenantId,
            type: 'INCOME',
            date: { gte: today, lt: tomorrow },
            status: 'confirmed',
          },
          _sum: { amount: true },
        }),
        this.prisma.client.count({
          where: {
            tenantId,
            createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
          },
        }),
        this.prisma.client.count({ where: { tenantId, active: true } }),
      ])

    return {
      todayAppointments,
      todayRevenue: todayRevenue._sum.amount ?? 0,
      monthClients,
      totalClients,
    }
  }
}
