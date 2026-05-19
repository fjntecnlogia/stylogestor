import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

function shape(p: {
  id: string; name: string; price: unknown; cost: unknown
  stock: number; minStock: number; category: string | null
  unit: string; active: boolean
}) {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price ?? 0),
    cost: Number(p.cost ?? 0),
    stock: p.stock,
    minStock: p.minStock,
    category: p.category ?? 'Outros',
    unit: p.unit,
    active: p.active,
  }
}

export async function GET() {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const products = await prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(products.map(shape))
  } catch (err) {
    console.error('[PRODUCTS_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const { name, price, cost, stock, minStock, category, unit } = body as {
      name?: string; price?: number; cost?: number
      stock?: number; minStock?: number; category?: string; unit?: string
    }

    if (!name?.trim() || price == null) {
      return NextResponse.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 })
    }

    const created = await prisma.product.create({
      data: {
        tenantId,
        name: name.trim(),
        price: Number(price),
        cost: cost != null ? Number(cost) : null,
        stock: Number(stock ?? 0),
        minStock: Number(minStock ?? 0),
        category: category ?? 'Outros',
        unit: unit ?? 'un',
        active: true,
      },
    })
    return NextResponse.json(shape(created))
  } catch (err) {
    console.error('[PRODUCTS_POST_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao cadastrar produto' }, { status: 500 })
  }
}
