import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { UpdateTenantDto } from './dto/update-tenant.dto'

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { schedules: true, subscription: true },
    })
    if (!tenant) throw new NotFoundException('Tenant não encontrado')
    return tenant
  }

  /**
   * Busca pública (chamada pelo middleware Next.js) — retorna apenas
   * campos seguros para resolver o subdomínio. NUNCA expor settings/email/phone aqui.
   */
  findBySlugPublic(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug, active: true },
      select: { id: true, name: true, plan: true, slug: true, logo: true },
    })
  }

  /**
   * Update por ID — usa updateMany com filtro composto (id) para garantir que
   * a contagem de linhas afetadas seja explícita (NotFound se 0).
   */
  async update(id: string, dto: UpdateTenantDto) {
    const updated = await this.prisma.tenant.updateMany({
      where: { id, active: true },
      data: dto,
    })
    if (updated.count === 0) {
      throw new NotFoundException('Tenant não encontrado')
    }
    return this.findById(id)
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
