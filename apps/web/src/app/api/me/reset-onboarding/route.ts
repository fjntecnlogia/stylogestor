import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { log } from '@/lib/logger'

/**
 * POST /api/me/reset-onboarding
 *
 * Limpa o publicMetadata da conta Clerk do user logado (preservando
 * apenas `role: 'gestor'`) — usado quando o metadata aponta pra um
 * tenant que não existe mais no banco (ex.: foi deletado via admin
 * SaaS mas o publicMetadata ficou). Sem essa limpeza, o user fica
 * preso num estado "fantasma": dashboard parece funcionar (vem do
 * cache localStorage) mas qualquer ação real no DB quebra com
 * "Tenant não encontrado".
 *
 * Depois desse reset, o user precisa:
 *   1. Fazer logout + login (ou aguardar o JWT renovar) pro session
 *      token refletir o metadata limpo
 *   2. Acessar /onboarding e criar a barbearia de novo
 *
 * Endpoint TEMPORÁRIO de recuperação. Remover quando o problema
 * estiver resolvido — não deveria ser usado em fluxo normal.
 */
export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const client = await clerkClient()

    // Pega o metadata atual antes de limpar (pra logar o que tinha)
    const user = await client.users.getUser(userId)
    const before = user.publicMetadata as Record<string, unknown>

    // Reseta — preserva role='gestor' pra middleware continuar tratando
    // como gestor (caso contrário pode ser tratado como barbeiro/desconhecido)
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: 'gestor',
      },
    })

    void log.warn(
      'api/me/reset-onboarding',
      'User resetou onboarding (metadata limpo)',
      {
        clerkUserId: userId,
        metadataBefore: before,
      },
    )

    return NextResponse.json({
      ok: true,
      message:
        'Metadata limpo. Faça LOGOUT e LOGIN de novo, depois acesse /onboarding pra criar a barbearia.',
      cleared: before,
    })
  } catch (err) {
    console.error('[RESET_ONBOARDING_ERROR]', err)
    const msg = err instanceof Error ? err.message : 'Erro ao resetar'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
