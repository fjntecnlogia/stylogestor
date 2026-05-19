import { NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { requireAdmin } from '@/lib/require-admin'

/**
 * GET /api/saas-settings/promo-codes/[id]/redemptions
 *
 * Histórico de uso de um código: quais barbearias resgataram,
 * quando e quantos dias foram concedidos. Útil pra entender o
 * impacto de cada código promocional.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (guard) return guard

  const { id } = await ctx.params
  try {
    const redemptions = await prisma.promoCodeRedemption.findMany({
      where: { promoCodeId: id },
      orderBy: { appliedAt: 'desc' },
    })

    // Busca nomes dos tenants pra mostrar na UI (não usa relation no schema)
    const tenantIds = [...new Set(redemptions.map((r) => r.tenantId))]
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true, slug: true },
    })
    const tenantMap = new Map(tenants.map((t) => [t.id, t]))

    return NextResponse.json(
      redemptions.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        tenantName: tenantMap.get(r.tenantId)?.name ?? '(barbearia removida)',
        tenantSlug: tenantMap.get(r.tenantId)?.slug ?? null,
        trialDays: r.trialDays,
        appliedAt: r.appliedAt.toISOString(),
      })),
    )
  } catch (err) {
    console.error('[REDEMPTIONS_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}
