import { NextRequest, NextResponse } from 'next/server'
import { getSetting, setSetting, SETTING_KEYS } from '@stylogestor/database'
import { requireAdmin } from '@/lib/require-admin'

const DEFAULT = 14 // fallback se não houver setting salvo

/**
 * GET /api/saas-settings/trial-days
 * Retorna o número de dias de trial padrão pra novos tenants.
 */
export async function GET() {
  const guard = await requireAdmin()
  if (guard) return guard

  const days = await getSetting<number>(SETTING_KEYS.DEFAULT_TRIAL_DAYS, DEFAULT)
  return NextResponse.json({ days })
}

/**
 * PUT /api/saas-settings/trial-days
 * Body: { days: number }
 * Atualiza o padrão. Próximas barbearias criadas usam esse valor.
 */
export async function PUT(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  try {
    const body = await req.json()
    const days = Number((body as { days?: unknown })?.days)
    if (!Number.isFinite(days) || days < 0 || days > 365) {
      return NextResponse.json(
        { error: 'days deve ser um número entre 0 e 365' },
        { status: 400 },
      )
    }

    await setSetting(SETTING_KEYS.DEFAULT_TRIAL_DAYS, Math.floor(days))
    return NextResponse.json({ ok: true, days: Math.floor(days) })
  } catch (err) {
    console.error('[TRIAL_DAYS_PUT_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
  }
}
