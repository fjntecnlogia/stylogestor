import { NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { requireAdmin } from '@/lib/require-admin'

export async function GET() {
  const guard = await requireAdmin()
  if (guard) return guard

  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        subscription: true,
        _count: { select: { clients: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.subscription?.plan ?? 'FREE',
      status: t.subscription?.status ?? (t.active ? 'active' : 'canceled'),
      mrr: t.subscription?.plan === 'STARTER' ? 79
           : t.subscription?.plan === 'PRO' ? 149
           : t.subscription?.plan === 'PREMIUM' ? 249 : 0,
      since: t.createdAt.toLocaleDateString('pt-BR'),
      city: (t.address as { city?: string } | null)?.city ?? '—',
      clients: t._count.clients,
      appts: t._count.appointments,
      lastLogin: t.updatedAt.toLocaleDateString('pt-BR'),
      email: t.email ?? '',
      phone: t.phone ?? '',
      trialEndsAt: t.trialEndsAt?.toLocaleDateString('pt-BR') ?? null,
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error('[ADMIN_TENANTS_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar tenants' }, { status: 500 })
  }
}
