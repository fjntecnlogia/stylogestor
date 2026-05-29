import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'
import { log } from '@/lib/logger'

/**
 * POST /api/me/reset-onboarding
 *
 * Endpoint TEMPORÁRIO de recuperação (usado pela página /reset-conta).
 *
 * Fase 3: o `app_metadata` só é gravável com service role, então a limpeza
 * real do metadata fantasma (ex.: tenantSlug apontando pra tenant deletado) é
 * responsabilidade do BACKEND (TODO: endpoint NestJS). Como o `auth-tenant`
 * resolve o tenant por supabaseId/email (não depende do metadata), o reset
 * principal aqui é o client limpar o localStorage + relogar (feito na página
 * /reset-conta). Mantemos o endpoint pra não quebrar esse fluxo.
 */
export async function POST() {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  void log.warn('api/me/reset-onboarding', 'User resetou onboarding', {
    supabaseUserId: user.id,
  })

  return NextResponse.json({
    ok: true,
    message:
      'Faça LOGOUT e LOGIN de novo. Se ainda aparecer "Tenant não encontrado", acesse /onboarding pra criar a barbearia.',
  })
}
