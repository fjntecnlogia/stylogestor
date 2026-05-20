import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { requireAdmin } from '@/lib/require-admin'
import { log } from '@/lib/logger'

/**
 * PATCH /api/tenants/[id]
 *
 * Multi-ação. O body define qual operação:
 *
 *   - { action: 'cancel' }            — soft delete (active=false + sub canceled)
 *   - { action: 'reactivate' }        — reverte cancel
 *   - { action: 'extendTrialDays', days: number }    — soma N dias ao trial atual
 *   - { action: 'setTrialEndsAt', date: 'YYYY-MM-DD' } — define data exata
 *   - { action: 'applyPromoCode', code: 'INFLUENCER' } — aplica código promocional
 *
 * As 3 últimas atualizam trialEndsAt do Tenant + currentPeriodEnd da Subscription.
 * applyPromoCode também registra um PromoCodeRedemption e incrementa usedCount.
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

  try {
    if (action === 'cancel') {
      await prisma.$transaction([
        prisma.tenant.update({ where: { id }, data: { active: false } }),
        prisma.subscription.updateMany({
          where: { tenantId: id },
          data: { status: 'canceled' },
        }),
      ])
      void log.warn('api/admin/tenants', 'Tenant cancelado (soft delete)', { tenantId: id }, id)
      return NextResponse.json({ ok: true, action })
    }

    if (action === 'reactivate') {
      await prisma.$transaction([
        prisma.tenant.update({ where: { id }, data: { active: true } }),
        prisma.subscription.updateMany({
          where: { tenantId: id },
          data: { status: 'active' },
        }),
      ])
      void log.info('api/admin/tenants', 'Tenant reativado', { tenantId: id }, id)
      return NextResponse.json({ ok: true, action })
    }

    if (action === 'extendTrialDays') {
      const days = Number((body as { days?: unknown })?.days)
      if (!Number.isFinite(days) || days <= 0 || days > 365) {
        return NextResponse.json({ error: 'days deve ser 1-365' }, { status: 400 })
      }
      const tenant = await prisma.tenant.findUnique({ where: { id }, select: { trialEndsAt: true } })
      if (!tenant) return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })

      // Soma à data atual de fim do trial (ou hoje, o que for mais distante)
      const base = tenant.trialEndsAt && tenant.trialEndsAt > new Date() ? tenant.trialEndsAt : new Date()
      const newEnd = new Date(base.getTime() + Math.floor(days) * 24 * 60 * 60 * 1000)

      await prisma.$transaction([
        prisma.tenant.update({ where: { id }, data: { trialEndsAt: newEnd } }),
        prisma.subscription.updateMany({
          where: { tenantId: id },
          data: { currentPeriodEnd: newEnd, status: 'trial' },
        }),
      ])
      return NextResponse.json({ ok: true, action, trialEndsAt: newEnd.toISOString() })
    }

    if (action === 'setTrialEndsAt') {
      const date = (body as { date?: string })?.date
      if (!date) return NextResponse.json({ error: 'date é obrigatório (YYYY-MM-DD)' }, { status: 400 })
      const parsed = new Date(date)
      if (isNaN(parsed.getTime())) return NextResponse.json({ error: 'date inválida' }, { status: 400 })

      await prisma.$transaction([
        prisma.tenant.update({ where: { id }, data: { trialEndsAt: parsed } }),
        prisma.subscription.updateMany({
          where: { tenantId: id },
          data: { currentPeriodEnd: parsed, status: 'trial' },
        }),
      ])
      return NextResponse.json({ ok: true, action, trialEndsAt: parsed.toISOString() })
    }

    if (action === 'applyPromoCode') {
      const code = (body as { code?: string })?.code?.trim().toUpperCase()
      if (!code) return NextResponse.json({ error: 'code é obrigatório' }, { status: 400 })

      const promo = await prisma.promoCode.findUnique({ where: { code } })
      if (!promo) return NextResponse.json({ error: 'Código não encontrado' }, { status: 404 })
      if (!promo.active) return NextResponse.json({ error: 'Código inativo' }, { status: 400 })
      if (promo.expiresAt && promo.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Código expirado' }, { status: 400 })
      }
      if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
        return NextResponse.json({ error: 'Código atingiu o limite de usos' }, { status: 400 })
      }

      // Soma os dias do código à data atual (ou ao fim do trial atual, o que for maior)
      const tenant = await prisma.tenant.findUnique({ where: { id }, select: { trialEndsAt: true } })
      if (!tenant) return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })
      const base = tenant.trialEndsAt && tenant.trialEndsAt > new Date() ? tenant.trialEndsAt : new Date()
      const newEnd = new Date(base.getTime() + promo.trialDays * 24 * 60 * 60 * 1000)

      await prisma.$transaction([
        prisma.tenant.update({ where: { id }, data: { trialEndsAt: newEnd, active: true } }),
        prisma.subscription.updateMany({
          where: { tenantId: id },
          data: { currentPeriodEnd: newEnd, status: 'trial' },
        }),
        prisma.promoCodeRedemption.create({
          data: { promoCodeId: promo.id, tenantId: id, trialDays: promo.trialDays },
        }),
        prisma.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        }),
      ])
      void log.info('api/admin/tenants', `Código promocional aplicado: ${code}`, {
        tenantId: id,
        code,
        trialDays: promo.trialDays,
        newEnd: newEnd.toISOString(),
      }, id)
      return NextResponse.json({
        ok: true, action, code,
        trialDaysAdded: promo.trialDays,
        trialEndsAt: newEnd.toISOString(),
      })
    }

    return NextResponse.json(
      {
        error:
          'action deve ser "cancel" | "reactivate" | "extendTrialDays" | "setTrialEndsAt" | "applyPromoCode"',
      },
      { status: 400 },
    )
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

    void log.warn('api/admin/tenants', `Tenant excluído (hard delete): ${tenant.name}`, {
      tenantId: id,
      name: tenant.name,
    })
    return NextResponse.json({ ok: true, deleted: tenant.name })
  } catch (err) {
    console.error('[ADMIN_TENANT_DELETE_ERROR]', err)
    void log.error('api/admin/tenants', 'Falha ao excluir tenant', {
      tenantId: id,
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Erro ao excluir barbearia' }, { status: 500 })
  }
}
