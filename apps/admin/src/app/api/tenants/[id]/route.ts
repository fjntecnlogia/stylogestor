import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { requireAdmin } from '@/lib/require-admin'

/**
 * PATCH /api/tenants/[id]
 *   body: { action: 'cancel' | 'reactivate' }
 * Soft delete: cancela a assinatura + marca tenant.active=false (cancel)
 * ou volta active=true e subscription.status='active' (reactivate).
 * Dados ficam no banco — pode recuperar depois.
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (guard) return guard

  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const action = (body as { action?: string })?.action

  if (action !== 'cancel' && action !== 'reactivate') {
    return NextResponse.json(
      { error: 'action deve ser "cancel" ou "reactivate"' },
      { status: 400 },
    )
  }

  try {
    if (action === 'cancel') {
      await prisma.$transaction([
        prisma.tenant.update({ where: { id }, data: { active: false } }),
        prisma.subscription.updateMany({
          where: { tenantId: id },
          data: { status: 'canceled' },
        }),
      ])
    } else {
      await prisma.$transaction([
        prisma.tenant.update({ where: { id }, data: { active: true } }),
        prisma.subscription.updateMany({
          where: { tenantId: id },
          data: { status: 'active' },
        }),
      ])
    }
    return NextResponse.json({ ok: true, action })
  } catch (err) {
    console.error('[ADMIN_TENANT_PATCH_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao atualizar barbearia' }, { status: 500 })
  }
}

/**
 * DELETE /api/tenants/[id]
 * Hard delete: remove o tenant e tudo que depende dele (clientes,
 * agendamentos, serviços, profissionais, assinatura). Sem volta.
 *
 * Confirma com query param `?confirmName=<nome>` que precisa bater
 * exatamente com tenant.name pra evitar acidente.
 */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (guard) return guard

  const { id } = await ctx.params
  const url = new URL(req.url)
  const confirmName = url.searchParams.get('confirmName')

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id }, select: { id: true, name: true } })
    if (!tenant) {
      return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })
    }
    if (confirmName !== tenant.name) {
      return NextResponse.json(
        { error: `Confirmação não bate. Esperado: "${tenant.name}"` },
        { status: 400 },
      )
    }

    // Cascade delete — o schema do Prisma deve ter onDelete:Cascade nas
    // FKs. Onde não tiver, deletamos manualmente em ordem.
    await prisma.$transaction([
      prisma.appointment.deleteMany({ where: { tenantId: id } }),
      prisma.client.deleteMany({ where: { tenantId: id } }),
      prisma.service.deleteMany({ where: { tenantId: id } }),
      prisma.professional.deleteMany({ where: { tenantId: id } }),
      prisma.businessSchedule.deleteMany({ where: { tenantId: id } }),
      prisma.subscription.deleteMany({ where: { tenantId: id } }),
      prisma.tenantUser.deleteMany({ where: { tenantId: id } }),
      prisma.tenant.delete({ where: { id } }),
    ])

    return NextResponse.json({ ok: true, deleted: tenant.name })
  } catch (err) {
    console.error('[ADMIN_TENANT_DELETE_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao excluir barbearia' }, { status: 500 })
  }
}
