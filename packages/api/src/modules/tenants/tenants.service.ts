import { Injectable, NotFoundException } from '@nestjs/common'
import { PlanType } from '@prisma/client'
import { CacheService } from '../../common/cache/cache.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { SupabaseMetadataService } from '../../common/auth/supabase-metadata.service'
import { UpdateTenantDto } from './dto/update-tenant.dto'
import { CreateTenantDto } from './dto/create-tenant.dto'

// Trial padrão (dias) quando o tenant é criado no onboarding. O web lê isso de
// um SystemSetting; aqui usamos um fixo pra não acoplar a API ao módulo de
// settings. Mudar exige redeploy — aceitável (onboarding mobile é raro mudar).
const DEFAULT_TRIAL_DAYS = 14

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
    private readonly supabaseMetadata: SupabaseMetadataService,
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

  /**
   * Lista as barbearias (tenants) das quais o usuário é membro ATIVO.
   * Usado no bootstrap do mobile (pós-login Supabase) pra descobrir qual
   * `x-tenant-slug` usar — ou se precisa passar pelo onboarding (lista vazia).
   *
   * NÃO depende do TenantGuard (usuário pode ainda não ter tenant).
   */
  async getMyMemberships(userId: string) {
    const memberships = await this.prisma.tenantUser.findMany({
      where: { userId, active: true },
      select: {
        role: true,
        tenant: {
          select: { id: true, slug: true, name: true, logo: true, plan: true, active: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })

    return memberships
      .filter((m) => m.tenant.active)
      .map((m) => ({
        id: m.tenant.id,
        slug: m.tenant.slug,
        name: m.tenant.name,
        logo: m.tenant.logo,
        plan: m.tenant.plan,
        role: m.role,
      }))
  }

  /**
   * Onboarding: cria a barbearia e vincula o usuário autenticado como `owner`.
   * Espelha o fluxo web (Next /api/tenants), mas sem o sync de metadata do Clerk
   * (não se aplica a usuários Supabase). Tudo numa transação pra ser atômico.
   */
  async createForUser(userId: string, dto: CreateTenantDto) {
    // Slug único: normaliza o nome e adiciona sufixo numérico em caso de colisão.
    const baseSlug =
      dto.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 30) || 'barbearia'

    let slug = baseSlug
    let attempt = 0
    while (
      await this.prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
    ) {
      attempt++
      slug = `${baseSlug}-${attempt}`
    }

    const now = new Date()
    const trialEnd = new Date(now.getTime() + DEFAULT_TRIAL_DAYS * 24 * 60 * 60 * 1000)
    const plan = (dto.plan ?? 'FREE') as PlanType

    const tenant = await this.prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          slug,
          name: dto.name,
          type: dto.type ?? 'barbershop',
          phone: dto.phone,
          plan,
          trialEndsAt: trialEnd,
          active: true,
          address: dto.city ? { city: dto.city } : undefined,
        },
        select: { id: true, slug: true, name: true },
      })

      await tx.tenantUser.create({
        data: { tenantId: t.id, userId, role: 'owner' },
      })

      if (dto.schedules?.length) {
        await tx.businessSchedule.createMany({
          data: dto.schedules.map((s) => ({
            tenantId: t.id,
            dayOfWeek: s.day,
            startTime: s.start,
            endTime: s.end,
            active: s.active ?? true,
          })),
        })
      }

      if (dto.professionals?.length) {
        await tx.professional.createMany({
          data: dto.professionals.map((p) => ({
            tenantId: t.id,
            name: p.name,
            role: p.role ?? 'Barbeiro',
            commission: Number(p.commission ?? 40),
            commissionType: 'percentage',
            active: true,
          })),
        })
      }

      if (dto.services?.length) {
        await tx.service.createMany({
          data: dto.services.map((sv) => ({
            tenantId: t.id,
            name: sv.name,
            price: sv.price,
            duration: sv.duration,
            active: true,
          })),
        })
      }

      // Subscription em trial (mesma lógica do web).
      await tx.subscription.create({
        data: {
          tenantId: t.id,
          plan: 'FREE',
          status: 'trial',
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
        },
      })

      return t
    })

    // Sync app_metadata no Supabase pro middleware do web ler role/tenant/assinatura
    // direto do JWT. Best-effort, fora da transação: usuário só-Clerk não tem
    // supabaseId → no-op; service_role ausente → no-op. Não derruba o onboarding.
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { supabaseId: true },
    })
    await this.supabaseMetadata.setAppMetadata(u?.supabaseId, {
      role: 'owner',
      tenantSlug: tenant.slug,
      subscriptionStatus: 'trial',
    })

    return { ok: true, tenant }
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
