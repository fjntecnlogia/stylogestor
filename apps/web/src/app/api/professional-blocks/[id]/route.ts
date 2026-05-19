import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const { id } = await ctx.params
  const owned = await prisma.professionalBlock.findFirst({ where: { id, tenantId } })
  if (!owned) return NextResponse.json({ error: 'Bloqueio não encontrado' }, { status: 404 })

  try {
    await prisma.professionalBlock.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PROF_BLOCK_DELETE_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao excluir bloqueio' }, { status: 500 })
  }
}
