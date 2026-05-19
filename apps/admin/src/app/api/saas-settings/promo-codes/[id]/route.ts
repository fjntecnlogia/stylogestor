import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { requireAdmin } from '@/lib/require-admin'

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (guard) return guard

  const { id } = await ctx.params
  try {
    const body = await req.json()
    const { description, trialDays, active, usageLimit, expiresAt } = body as {
      description?: string; trialDays?: number; active?: boolean
      usageLimit?: number | null; expiresAt?: string | null
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data: {
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(trialDays !== undefined ? { trialDays: Math.max(1, Math.floor(Number(trialDays))) } : {}),
        ...(active !== undefined ? { active } : {}),
        ...(usageLimit !== undefined ? { usageLimit: usageLimit && usageLimit > 0 ? Math.floor(usageLimit) : null } : {}),
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
      },
    })
    return NextResponse.json({
      id: updated.id,
      code: updated.code,
      description: updated.description ?? '',
      trialDays: updated.trialDays,
      active: updated.active,
      usageLimit: updated.usageLimit,
      usedCount: updated.usedCount,
      expiresAt: updated.expiresAt ? updated.expiresAt.toISOString() : null,
    })
  } catch (err) {
    console.error('[PROMO_CODE_PATCH_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao atualizar código' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (guard) return guard

  const { id } = await ctx.params
  try {
    await prisma.promoCode.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PROMO_CODE_DELETE_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao excluir código' }, { status: 500 })
  }
}
