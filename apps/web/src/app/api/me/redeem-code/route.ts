import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

/**
 * POST /api/me/redeem-code
 * Body: { code: string }
 *
 * Auto-resgate de código promocional pelo gestor da própria barbearia.
 * Soma trialDays do código ao trial atual (ou hoje, o que for maior).
 *
 * Validações:
 *   - Código existe + ativo + não expirado
 *   - Dentro do limite de usos (se houver)
 *   - O tenant ainda não usou ESSE código (anti-abuso simples)
 */
export async function POST(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const code = (body as { code?: string })?.code?.trim().toUpperCase()
    if (!code) {
      return NextResponse.json({ error: 'Digite um código' }, { status: 400 })
    }

    const promo = await prisma.promoCode.findUnique({ where: { code } })
    if (!promo) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 404 })
    }
    if (!promo.active) {
      return NextResponse.json({ error: 'Esse código não está mais ativo' }, { status: 400 })
    }
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Esse código expirou' }, { status: 400 })
    }
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return NextResponse.json({ error: 'Esse código atingiu o limite de usos' }, { status: 400 })
    }

    // Anti-abuso: cada tenant só pode usar o mesmo código UMA vez.
    // (Admin via /api/tenants/[id] pode aplicar múltiplas vezes — endpoint diferente.)
    const alreadyUsed = await prisma.promoCodeRedemption.findFirst({
      where: { promoCodeId: promo.id, tenantId },
    })
    if (alreadyUsed) {
      return NextResponse.json(
        { error: 'Você já resgatou esse código' },
        { status: 400 },
      )
    }

    // Soma os dias à data atual de fim do trial (ou hoje, o que for maior)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { trialEndsAt: true, name: true },
    })
    if (!tenant) {
      return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })
    }
    const base = tenant.trialEndsAt && tenant.trialEndsAt > new Date()
      ? tenant.trialEndsAt
      : new Date()
    const newEnd = new Date(base.getTime() + promo.trialDays * 24 * 60 * 60 * 1000)

    await prisma.$transaction([
      prisma.tenant.update({
        where: { id: tenantId },
        data: { trialEndsAt: newEnd, active: true },
      }),
      prisma.subscription.updateMany({
        where: { tenantId },
        data: { currentPeriodEnd: newEnd, status: 'trial' },
      }),
      prisma.promoCodeRedemption.create({
        data: { promoCodeId: promo.id, tenantId, trialDays: promo.trialDays },
      }),
      prisma.promoCode.update({
        where: { id: promo.id },
        data: { usedCount: { increment: 1 } },
      }),
    ])

    return NextResponse.json({
      ok: true,
      code,
      trialDaysAdded: promo.trialDays,
      trialEndsAt: newEnd.toISOString(),
    })
  } catch (err) {
    console.error('[REDEEM_CODE_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao resgatar código' }, { status: 500 })
  }
}
