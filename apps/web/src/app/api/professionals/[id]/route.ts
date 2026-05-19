import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

/**
 * PATCH /api/professionals/[id]
 * Body: { name?, role?, phone?, commission?, active? }
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const { id } = await ctx.params

  // Confirma que o profissional pertence ao tenant logado
  const owned = await prisma.professional.findFirst({ where: { id, tenantId } })
  if (!owned) return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const { name, role, phone, commission, active } = body as {
      name?: string; role?: string; phone?: string; commission?: number; active?: boolean
    }

    const updated = await prisma.professional.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(commission !== undefined ? { commission: Number(commission) } : {}),
        ...(active !== undefined ? { active } : {}),
      },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      role: updated.role,
      phone: updated.phone ?? '',
      commission: Number(updated.commission),
      active: updated.active,
    })
  } catch (err) {
    console.error('[PROFESSIONAL_PATCH_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao atualizar profissional' }, { status: 500 })
  }
}

/**
 * DELETE /api/professionals/[id]
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const { id } = await ctx.params

  const owned = await prisma.professional.findFirst({ where: { id, tenantId } })
  if (!owned) return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 })

  try {
    await prisma.professional.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PROFESSIONAL_DELETE_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao excluir profissional' }, { status: 500 })
  }
}
