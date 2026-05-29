import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'

/**
 * POST /api/me/tour-completed
 * Marca `tourCompleted` no app_metadata (lido pelo <DashboardTour />).
 *
 * Fase 3: app_metadata exige service role → a escrita real é responsabilidade
 * do BACKEND (TODO: PATCH /me/tour-completed no NestJS). Interim: retorna ok
 * (não-bloqueante; o tour pode reaparecer numa nova sessão até o backend
 * persistir a flag).
 */
export async function POST() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // TODO(backend): persistir app_metadata.tourCompleted=true via endpoint NestJS.
  return NextResponse.json({ ok: true })
}
