import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

/**
 * POST /api/professionals/[id]/reset-password
 *
 * Gestor redefine a senha de um profissional (barbeiro).
 *
 * ⚠️ Fase 3 (Clerk→Supabase): trocar a senha de OUTRO usuário exige a SERVICE
 * ROLE do Supabase (só no backend, por decisão). Então o reset real vira um
 * endpoint NestJS (TODO: POST /professionals/:id/reset-password →
 * `auth.admin.updateUserById(barbeiroId, { password })`). Aqui validamos tudo
 * que o web consegue (caller é gestor, profissional é do tenant, senha válida)
 * e retornamos 501 enquanto o endpoint não existe.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    // 1) Auth do gestor
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    // Backend grava role='owner' pro gestor; só 'barbeiro' é restrito.
    const callerRole = (user.app_metadata as { role?: string } | undefined)?.role
    if (callerRole === 'barbeiro') {
      return NextResponse.json({ error: 'Apenas gestores podem trocar senhas' }, { status: 403 })
    }

    const tenantId = await getCurrentTenantId()
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

    // 2) Valida que o profissional é do tenant do gestor
    const { id } = await ctx.params
    const prof = await prisma.professional.findFirst({
      where: { id, tenantId },
      select: { id: true, name: true, email: true },
    })
    if (!prof) {
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 })
    }
    if (!prof.email) {
      return NextResponse.json(
        { error: 'Profissional não tem email cadastrado — não dá pra encontrar o login dele.' },
        { status: 400 },
      )
    }

    // 3) Validação do body
    const body = await req.json().catch(() => ({}))
    const password = (body as { password?: string })?.password
    if (typeof password !== 'string' || password.trim().length < 8) {
      return NextResponse.json(
        { error: 'A senha precisa ter pelo menos 8 caracteres' },
        { status: 400 },
      )
    }

    // 4) Reset real da senha → backend (service role).
    return NextResponse.json(
      {
        error:
          'Redefinição de senha de profissional está sendo migrada para o novo ' +
          'sistema de login. Em breve. Por enquanto, o profissional pode usar ' +
          '"Esqueci minha senha" na tela de login.',
        pending: 'backend-endpoint',
      },
      { status: 501 },
    )
  } catch (err) {
    console.error('[PROFESSIONAL_RESET_PASSWORD_ERROR]', err)
    const message = err instanceof Error ? err.message : 'Erro ao trocar senha'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
