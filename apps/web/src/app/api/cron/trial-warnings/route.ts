import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { clerkClient } from '@clerk/nextjs/server'
import { sendTrialExpiringEmail } from '@/lib/resend'
import { log } from '@/lib/logger'

/**
 * GET /api/cron/trial-warnings
 *
 * Job diário — dispara email pra barbearias com trial expirando em
 * 3, 1 ou 0 dias. Idempotente via campo Subscription.canceledAt
 * temporariamente NÃO suficiente — usaríamos uma tabela NotificationLog
 * pra evitar duplicata, mas pra MVP confiamos no cron rodar 1x/dia.
 *
 * Proteção: header `X-Cron-Secret` deve bater com env CRON_SECRET.
 * Sem isso, qualquer um na internet poderia disparar emails em massa.
 *
 * Pra agendar (na VPS):
 *   crontab -e
 *   0 9 * * * curl -H "X-Cron-Secret: $CRON_SECRET" https://app.stylogestor.com.br/api/cron/trial-warnings
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Janelas de aviso: 3 dias, 1 dia, 0 dias (hoje)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const windows = [
    { daysLeft: 3, label: '3 dias' },
    { daysLeft: 1, label: '1 dia' },
    { daysLeft: 0, label: 'hoje' },
  ]

  const results: Array<{ daysLeft: number; count: number; sent: number; failed: number }> = []

  for (const window of windows) {
    // Tenants com trialEndsAt entre [startOfToday + N days, startOfToday + N+1 days)
    const windowStart = new Date(startOfToday.getTime() + window.daysLeft * 86400000)
    const windowEnd = new Date(windowStart.getTime() + 86400000)

    const tenants = await prisma.tenant.findMany({
      where: {
        active: true,
        trialEndsAt: { gte: windowStart, lt: windowEnd },
        subscription: { status: 'trial' },
      },
      select: {
        id: true,
        name: true,
        users: {
          where: { role: 'owner' },
          select: { user: { select: { clerkId: true } } },
          take: 1,
        },
      },
    })

    let sent = 0
    let failed = 0

    for (const tenant of tenants) {
      const clerkId = tenant.users[0]?.user?.clerkId
      if (!clerkId) { failed++; continue }

      try {
        const client = await clerkClient()
        const user = await client.users.getUser(clerkId)
        const email =
          user.primaryEmailAddress?.emailAddress ??
          user.emailAddresses?.[0]?.emailAddress
        if (!email) { failed++; continue }

        const ok = await sendTrialExpiringEmail(email, tenant.name, window.daysLeft)
        if (ok) sent++
        else failed++
      } catch (err) {
        console.error(`[TRIAL_WARN_ERROR] tenant=${tenant.id}`, err)
        failed++
      }
    }

    results.push({ daysLeft: window.daysLeft, count: tenants.length, sent, failed })
  }

  // Loga só se realmente tentou enviar algo
  const totalSent = results.reduce((s, r) => s + r.sent, 0)
  const totalFailed = results.reduce((s, r) => s + r.failed, 0)
  if (totalSent + totalFailed > 0) {
    void log.info('cron/trial-warnings', `Trial warnings processados: ${totalSent} enviados, ${totalFailed} falhas`, {
      results,
    })
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    results,
  })
}
