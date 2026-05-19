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
  const owned = await prisma.service.findFirst({ where: { id, tenantId } })
  if (!owned) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const { name, price, duration, category, active } = body as {
      name?: string; price?: number; duration?: number; category?: string; active?: boolean
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(duration !== undefined ? { duration: Number(duration) } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(active !== undefined ? { active } : {}),
      },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      price: Number(updated.price),
      duration: updated.duration,
      category: updated.category ?? 'Corte',
      active: updated.active,
      count: 0,
    })
  } catch (err) {
    console.error('[SERVICE_PATCH_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao atualizar serviço' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const { id } = await ctx.params
  const owned = await prisma.service.findFirst({ where: { id, tenantId } })
  if (!owned) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })

  try {
    // Hard delete — serviços não têm histórico crítico (a relação
    // AppointmentService preserva o nome no agendamento via snapshot).
    await prisma.service.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[SERVICE_DELETE_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao excluir serviço' }, { status: 500 })
  }
}
