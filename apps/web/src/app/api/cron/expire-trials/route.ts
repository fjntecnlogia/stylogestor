import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { log } from '@/lib/logger'

/**
 * GET /api/cron/expire-trials
 *
 * Job diário — para cada Subscription com `status='trial'` cujo
 * `Tenant.trialEndsAt` já passou, atualiza o status para `'expired'`.
 *
 * Sem isso, o trial fica em `'trial'` para sempre e o middleware do
 * web (que bloqueia apenas `expired/past_due/canceled/unpaid`) deixa
 * a barbearia usar o sistema indefinidamente sem assinar.
 *
 * O app_metadata.subscriptionStatus do JWT só reflete o valor novo
 * APÓS o próximo login (ou refresh via sync-claims) — o backend lê
 * `Subscription.status` em `tenants.service.ts#syncClaimsForUser`.
 * Então a expiração tem efeito real após o user relogar.
 *
 * Proteção: header `X-Cron-Secret` (igual aos outros crons).
 * Agendar no crontab da VPS (00:30 BRT diariamente).
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()
  try {
    // Busca as subscriptions trial cujo tenant tem trialEndsAt no passado
    const expired = await prisma.subscription.findMany({
      where: {
        status: 'trial',
        tenant: { trialEndsAt: { lt: now } },
      },
      select: { id: true, tenantId: true, tenant: { select: { slug: true, name: true } } },
    })

    if (expired.length === 0) {
      return NextResponse.json({ ok: true, timestamp: now.toISOString(), expired: 0 })
    }

    await prisma.subscription.updateMany({
      where: { id: { in: expired.map((s) => s.id) } },
      data: { status: 'expired' },
    })

    void log.warn(
      'cron/expire-trials',
      `Expirou ${expired.length} trial(s)`,
      { tenants: expired.map((s) => ({ slug: s.tenant.slug, name: s.tenant.name })) },
    )

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      expired: expired.length,
      tenants: expired.map((s) => s.tenant.slug),
    })
  } catch (err) {
    console.error('[EXPIRE_TRIALS_ERROR]', err)
    void log.error('cron/expire-trials', 'Erro no cron de expiração de trials', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Erro no cron' }, { status: 500 })
  }
}
