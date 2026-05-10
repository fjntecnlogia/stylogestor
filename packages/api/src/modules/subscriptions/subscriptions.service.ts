import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

const PLANS = [
  { id: 'STARTER', name: 'Starter', price: 79, professionals: 1, features: ['agenda', 'clientes', 'booking_online'] },
  { id: 'PRO', name: 'Pro', price: 149, professionals: 5, features: ['agenda', 'clientes', 'booking_online', 'whatsapp', 'financeiro', 'comissoes', 'relatorios'] },
  { id: 'PREMIUM', name: 'Premium', price: 249, professionals: -1, features: ['all'] },
]

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  getPlans() { return PLANS }

  getCurrent(tenantId: string) {
    return this.prisma.subscription.findUnique({ where: { tenantId } })
  }

  async handlePagarmeWebhook(payload: Record<string, unknown>) {
    const { type, data } = payload as { type: string; data: Record<string, unknown> }
    const metadata = data?.metadata as Record<string, string> | undefined
    const tenantId = metadata?.tenantId
    if (!tenantId) return { ok: true }

    if (type === 'subscription.paid') {
      await this.prisma.subscription.upsert({
        where: { tenantId },
        create: { tenantId, plan: 'PRO', status: 'active', pagarmeSubId: data.id as string },
        update: { status: 'active', currentPeriodEnd: new Date(data.current_period?.end_at as string) },
      })
      await this.prisma.tenant.update({ where: { id: tenantId }, data: { plan: 'PRO' } })
    }

    if (type === 'subscription.canceled') {
      await this.prisma.subscription.update({ where: { tenantId }, data: { status: 'canceled', canceledAt: new Date() } })
      await this.prisma.tenant.update({ where: { id: tenantId }, data: { plan: 'FREE' } })
    }

    return { ok: true }
  }
}
