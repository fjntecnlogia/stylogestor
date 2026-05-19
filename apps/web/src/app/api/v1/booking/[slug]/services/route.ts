import { NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'

/**
 * GET /api/v1/booking/[slug]/services
 * Endpoint PÚBLICO — lista serviços ativos pra cliente final escolher.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, active: true },
    })
    if (!tenant || !tenant.active) {
      return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })
    }
    const services = await prisma.service.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, name: true, description: true,
        price: true, duration: true, category: true,
      },
    })
    return NextResponse.json(
      services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? '',
        price: Number(s.price),
        duration: s.duration,
        category: s.category ?? 'Outros',
      })),
    )
  } catch (err) {
    console.error('[BOOKING_SERVICES_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar serviços' }, { status: 500 })
  }
}
