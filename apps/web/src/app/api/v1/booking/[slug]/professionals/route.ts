import { NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'

/**
 * GET /api/v1/booking/[slug]/professionals
 * Endpoint PÚBLICO — lista profissionais ativos pra cliente escolher.
 * NÃO expõe email/phone/comissão — só nome + role pra UI.
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
    const professionals = await prisma.professional.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, role: true, avatar: true, bio: true },
    })
    return NextResponse.json(
      professionals.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        avatar: p.avatar,
        bio: p.bio ?? '',
      })),
    )
  } catch (err) {
    console.error('[BOOKING_PROFS_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar profissionais' }, { status: 500 })
  }
}
