import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const { id } = await ctx.params
  const owned = await prisma.product.findFirst({ where: { id, tenantId } })
  if (!owned) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const { name, price, cost, stock, minStock, category, unit, active } = body as {
      name?: string; price?: number; cost?: number
      stock?: number; minStock?: number; category?: string; unit?: string; active?: boolean
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(cost !== undefined ? { cost: cost != null ? Number(cost) : null } : {}),
        ...(stock !== undefined ? { stock: Number(stock) } : {}),
        ...(minStock !== undefined ? { minStock: Number(minStock) } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(unit !== undefined ? { unit } : {}),
        ...(active !== undefined ? { active } : {}),
      },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      price: Number(updated.price),
      cost: Number(updated.cost ?? 0),
      stock: updated.stock,
      minStock: updated.minStock,
      category: updated.category ?? 'Outros',
      unit: updated.unit,
      active: updated.active,
    })
  } catch (err) {
    console.error('[PRODUCT_PATCH_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const { id } = await ctx.params
  const owned = await prisma.product.findFirst({ where: { id, tenantId } })
  if (!owned) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

  try {
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PRODUCT_DELETE_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 })
  }
}
