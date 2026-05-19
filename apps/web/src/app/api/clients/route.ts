import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'
import { readSettings } from '@/lib/tenant-settings'

/**
 * Computa `segment` a partir das métricas reais do cliente.
 * Frontend-only — não persistido no banco. Quando o cliente
 * mudar de comportamento (visita / fica inativo), o segment
 * recalcula sozinho.
 */
function computeSegment(
  totalVisits: number,
  totalSpent: number,
  lastVisit: Date | null,
): 'vip' | 'risco' | 'inativo' | 'novo' | 'regular' {
  const daysSinceLastVisit = lastVisit
    ? Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity
  if (daysSinceLastVisit > 60) return 'inativo'
  if (totalVisits >= 10 || totalSpent >= 500) return 'vip'
  if (totalVisits <= 2) return 'novo'
  if (daysSinceLastVisit > 30) return 'risco'
  return 'regular'
}

function shapeClient(c: {
  id: string; name: string; phone: string; email: string | null
  totalVisits: number; totalSpent: unknown; lastVisit: Date | null; tags: string[]
}) {
  const totalSpent = Number(c.totalSpent ?? 0)
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email ?? '',
    visits: c.totalVisits,
    spent: totalSpent,
    lastVisit: c.lastVisit ? c.lastVisit.toLocaleDateString('pt-BR') : '',
    tags: c.tags,
    segment: computeSegment(c.totalVisits, totalSpent, c.lastVisit),
  }
}

export async function GET() {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const clients = await prisma.client.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(clients.map(shapeClient))
  } catch (err) {
    console.error('[CLIENTS_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const { name, phone, email, tags } = body as {
      name?: string; phone?: string; email?: string; tags?: string[]
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Telefone obrigatório ou opcional? Controlado por tenant.settings.requireClientPhone.
    // Default: true (telefone obrigatório — padrão de barbearia que usa WhatsApp).
    const tenantRow = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })
    const settings = readSettings(tenantRow?.settings)
    if (settings.requireClientPhone && !phone?.trim()) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório. Desligue "Exigir telefone" em Configurações se quiser cadastrar sem.' },
        { status: 400 },
      )
    }

    const created = await prisma.client.create({
      data: {
        tenantId,
        name: name.trim(),
        phone: phone?.trim() ?? '',
        email: email?.trim() || null,
        tags: Array.isArray(tags) ? tags : [],
        active: true,
      },
    })

    return NextResponse.json(shapeClient(created))
  } catch (err) {
    console.error('[CLIENTS_POST_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
