import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { requireAdmin } from '@/lib/require-admin'

function shape(p: {
  id: string; code: string; description: string | null
  trialDays: number; active: boolean
  usageLimit: number | null; usedCount: number
  expiresAt: Date | null
}) {
  return {
    id: p.id,
    code: p.code,
    description: p.description ?? '',
    trialDays: p.trialDays,
    active: p.active,
    usageLimit: p.usageLimit,
    usedCount: p.usedCount,
    expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
  }
}

/**
 * GET /api/saas-settings/promo-codes
 * Lista todos os códigos cadastrados.
 */
export async function GET() {
  const guard = await requireAdmin()
  if (guard) return guard

  try {
    const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(codes.map(shape))
  } catch (err) {
    console.error('[PROMO_CODES_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao listar códigos' }, { status: 500 })
  }
}

/**
 * POST /api/saas-settings/promo-codes
 * Body: { code, description?, trialDays, usageLimit?, expiresAt? }
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  try {
    const body = await req.json()
    const { code, description, trialDays, usageLimit, expiresAt } = body as {
      code?: string; description?: string; trialDays?: number
      usageLimit?: number | null; expiresAt?: string | null
    }

    const codeNorm = code?.trim().toUpperCase()
    if (!codeNorm) return NextResponse.json({ error: 'Código é obrigatório' }, { status: 400 })
    const days = Number(trialDays)
    if (!Number.isFinite(days) || days <= 0 || days > 365) {
      return NextResponse.json({ error: 'trialDays deve ser 1-365' }, { status: 400 })
    }

    const created = await prisma.promoCode.create({
      data: {
        code: codeNorm,
        description: description?.trim() || null,
        trialDays: Math.floor(days),
        usageLimit: usageLimit && usageLimit > 0 ? Math.floor(usageLimit) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: true,
      },
    })
    return NextResponse.json(shape(created))
  } catch (err: unknown) {
    // Unique violation no Postgres: P2002
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Código já existe' }, { status: 409 })
    }
    console.error('[PROMO_CODES_POST_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao criar código' }, { status: 500 })
  }
}
