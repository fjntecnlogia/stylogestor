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
  const owned = await prisma.client.findFirst({ where: { id, tenantId } })
  if (!owned) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const { name, phone, email, tags } = body as {
      name?: string; phone?: string; email?: string; tags?: string[]
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone.trim() } : {}),
        ...(email !== undefined ? { email: email?.trim() || null } : {}),
        ...(tags !== undefined ? { tags } : {}),
      },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      email: updated.email ?? '',
      visits: updated.totalVisits,
      spent: Number(updated.totalSpent),
      lastVisit: updated.lastVisit ? updated.lastVisit.toLocaleDateString('pt-BR') : '',
      tags: updated.tags,
    })
  } catch (err) {
    console.error('[CLIENT_PATCH_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const { id } = await ctx.params
  const owned = await prisma.client.findFirst({ where: { id, tenantId } })
  if (!owned) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  try {
    // Soft delete via active=false — preserva histórico de atendimentos.
    // Pra hard delete: usar prisma.client.delete (vai cascade nos appointments).
    await prisma.client.update({ where: { id }, data: { active: false } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[CLIENT_DELETE_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao excluir cliente' }, { status: 500 })
  }
}
