import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'
import { log } from '@/lib/logger'

/**
 * POST /api/professionals/[id]/reset-password
 *
 * Permite ao gestor redefinir a senha de um profissional (barbeiro)
 * que tem conta Clerk. Útil quando o profissional esquece a senha e
 * o gestor precisa destravar na hora — sem ter que pedir pro Clerk
 * mandar email de reset.
 *
 * Fluxo:
 *   1. Confirma que quem chama é o gestor logado com tenantId
 *   2. Busca o Professional no DB e valida que pertence AO MESMO tenant
 *      (segurança: gestor de uma barbearia NÃO pode resetar senha de
 *      barbeiro de outra)
 *   3. Procura o user Clerk pelo email do Professional (Clerk Backend
 *      API: getUserList com filtro emailAddress)
 *   4. Sanity check: confirma que o user tem role='barbeiro' E
 *      professionalId casando — evita resetar conta errada se 2 users
 *      tiverem o mesmo email por algum motivo
 *   5. Chama updateUser({ password }) — Clerk aplica validação de
 *     força mínima da própria org
 *
 * Loga em system_logs (level=warn) com tenantId pra audit trail —
 * importante porque é ação destrutiva (gestor toma controle da conta
 * do funcionário).
 *
 * Body: { password: string }
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    // 1) Auth do gestor
    const { userId, sessionClaims } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const callerRole = (sessionClaims?.metadata as Record<string, string> | undefined)?.role
    if (callerRole && callerRole !== 'gestor') {
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

    // 4) Encontra o user Clerk
    const client = await clerkClient()
    const userList = await client.users.getUserList({ emailAddress: [prof.email] })
    const candidates = userList.data ?? []
    if (candidates.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma conta encontrada com esse email. O profissional já aceitou o convite?' },
        { status: 404 },
      )
    }

    // 5) Sanity check: escolhe o user cujo publicMetadata.professionalId casa
    // (proteção pra casos raros onde múltiplos users compartilham email)
    const matched =
      candidates.find((u) => {
        const meta = u.publicMetadata as { professionalId?: string } | undefined
        return meta?.professionalId === prof.id
      }) ?? candidates[0]

    // 6) Aplica a nova senha
    await client.users.updateUser(matched.id, { password })

    void log.warn(
      'api/professionals/reset-password',
      `Gestor redefiniu senha do profissional ${prof.name}`,
      {
        professionalId: prof.id,
        professionalEmail: prof.email,
        clerkUserId: matched.id,
        callerClerkId: userId,
      },
      tenantId,
    )

    return NextResponse.json({ ok: true, professionalId: prof.id })
  } catch (err) {
    console.error('[PROFESSIONAL_RESET_PASSWORD_ERROR]', err)
    // Clerk costuma retornar erro 422 com mensagem útil quando a senha
    // é fraca, repete a anterior, ou viola política da org. Repassa.
    const message = err instanceof Error ? err.message : 'Erro ao trocar senha'
    const clerkErrors = (err as { errors?: Array<{ longMessage?: string; message?: string }> })?.errors
    const friendly = clerkErrors?.[0]?.longMessage || clerkErrors?.[0]?.message || message
    return NextResponse.json({ error: friendly }, { status: 400 })
  }
}
