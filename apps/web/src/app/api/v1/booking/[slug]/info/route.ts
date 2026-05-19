import { NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { readSettings } from '@/lib/tenant-settings'

/**
 * GET /api/v1/booking/[slug]/info
 *
 * Endpoint PÚBLICO (sem auth Clerk). Retorna info essencial da barbearia
 * pra renderizar a landing de agendamento. Inclui settings relevantes
 * pro cliente final (autoConfirm, leadHours, etc).
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, name: true, phone: true, email: true,
        address: true, logo: true, settings: true, active: true,
        schedules: { orderBy: { dayOfWeek: 'asc' } },
      },
    })
    if (!tenant || !tenant.active) {
      return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })
    }

    const addr = (tenant.address as Record<string, string> | null) ?? {}
    const settings = readSettings(tenant.settings)

    return NextResponse.json({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      phone: tenant.phone ?? '',
      email: tenant.email ?? '',
      address: addr.street ?? '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      logo: tenant.logo ?? '',
      schedules: tenant.schedules.map((s) => ({
        day: s.dayOfWeek,
        start: s.startTime,
        end: s.endTime,
        active: s.active,
      })),
      // Só expõe settings que afetam o cliente final, nada de allowOverlapping etc
      bookingLeadHours: settings.bookingLeadHours,
      maxBookingDaysAhead: settings.maxBookingDaysAhead,
    })
  } catch (err) {
    console.error('[BOOKING_INFO_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar barbearia' }, { status: 500 })
  }
}
