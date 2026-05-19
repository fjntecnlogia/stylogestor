import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

function shapeService(s: {
  id: string; name: string; price: unknown; duration: number
  category: string | null; active: boolean
}) {
  return {
    id: s.id,
    name: s.name,
    price: Number(s.price ?? 0),
    duration: s.duration,
    category: s.category ?? 'Corte',
    active: s.active,
    count: 0, // Métrica de "vezes realizado" — virá de prisma.appointmentService.count agrupado.
              // Quando o módulo de stats estiver plugado, agregar aqui.
  }
}

export async function GET() {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const services = await prisma.service.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(services.map(shapeService))
  } catch (err) {
    console.error('[SERVICES_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar serviços' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const { name, price, duration, category } = body as {
      name?: string; price?: number; duration?: number; category?: string
    }

    if (!name?.trim() || price == null || duration == null) {
      return NextResponse.json({ error: 'Nome, preço e duração são obrigatórios' }, { status: 400 })
    }

    const created = await prisma.service.create({
      data: {
        tenantId,
        name: name.trim(),
        price: Number(price),
        duration: Number(duration),
        category: category ?? 'Corte',
        active: true,
      },
    })
    return NextResponse.json(shapeService(created))
  } catch (err) {
    console.error('[SERVICES_POST_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao criar serviço' }, { status: 500 })
  }
}
