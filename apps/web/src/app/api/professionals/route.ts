import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

/**
 * GET /api/professionals
 * Lista profissionais do tenant do gestor logado.
 * Fonte de verdade do banco — substitui o localStorage quando disponível.
 */
export async function GET() {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
  }

  try {
    const pros = await prisma.professional.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    })

    // Shape compatível com ProfessionalFixture (frontend)
    const result = pros.map((p, idx) => ({
      id: p.id,
      name: p.name,
      role: p.role ?? 'Barbeiro',
      phone: p.phone ?? '',
      commission: Number(p.commission ?? 40),
      active: p.active,
      schedules: [
        { day: 1, start: '09:00', end: '18:00' }, { day: 2, start: '09:00', end: '18:00' },
        { day: 3, start: '09:00', end: '18:00' }, { day: 4, start: '09:00', end: '18:00' },
        { day: 5, start: '09:00', end: '18:00' }, { day: 6, start: '09:00', end: '14:00' },
      ],
      stats: { month: 0, revenue: 0, commission: 0 },
      // Métricas reais serão computadas quando o módulo de stats estiver plugado.
      _idx: idx,
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error('[PROFESSIONALS_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar profissionais' }, { status: 500 })
  }
}

/**
 * POST /api/professionals
 * Cria um profissional novo no tenant do gestor logado.
 * Body: { name, role?, phone?, commission?, email? }
 */
export async function POST(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const { name, role, phone, commission } = body as {
      name?: string
      role?: string
      phone?: string
      commission?: number
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const professional = await prisma.professional.create({
      data: {
        tenantId,
        name: name.trim(),
        role: role ?? 'Barbeiro',
        phone: phone ?? null,
        commission: Number(commission ?? 40),
        commissionType: 'percentage',
        active: true,
      },
    })

    return NextResponse.json({
      id: professional.id,
      name: professional.name,
      role: professional.role,
      phone: professional.phone ?? '',
      commission: Number(professional.commission),
      active: professional.active,
      schedules: [
        { day: 1, start: '09:00', end: '18:00' }, { day: 2, start: '09:00', end: '18:00' },
        { day: 3, start: '09:00', end: '18:00' }, { day: 4, start: '09:00', end: '18:00' },
        { day: 5, start: '09:00', end: '18:00' }, { day: 6, start: '09:00', end: '14:00' },
      ],
      stats: { month: 0, revenue: 0, commission: 0 },
    })
  } catch (err) {
    console.error('[PROFESSIONALS_POST_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao criar profissional' }, { status: 500 })
  }
}
