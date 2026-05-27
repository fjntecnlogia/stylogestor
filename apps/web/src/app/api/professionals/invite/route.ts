import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@stylogestor/database'

/**
 * POST /api/professionals/invite
 *
 * Chamado pelo gestor ao cadastrar um profissional novo no painel.
 * Cria um usuário no Clerk com `publicMetadata.role = 'barbeiro'` e
 * dispara o envio do convite por email (Clerk → 'Invitation' email
 * com link pra definir senha).
 *
 * Body esperado:
 *   {
 *     name: string,
 *     email: string,
 *     phone?: string,
 *     professionalId: string,    // ID local do profissional no banco/state
 *     tenantSlug?: string,       // slug do tenant (pra metadata)
 *   }
 *
 * Resposta de sucesso:
 *   { invitationId, status: 'sent' }
 *
 * Requer: o caller (gestor) ESTÁ autenticado (auth() retorna userId).
 */
export async function POST(req: NextRequest) {
  try {
    // 1) Confirma que quem chama é um gestor logado
    const { userId, sessionClaims } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const callerRole = (sessionClaims?.metadata as Record<string, string> | undefined)?.role
    // 'gestor' explícito OU sem role definida (retrocompat com contas criadas antes deste sistema)
    if (callerRole && callerRole !== 'gestor') {
      return NextResponse.json({ error: 'Apenas gestores podem convidar profissionais' }, { status: 403 })
    }

    // 2) Validação do body
    const body = await req.json()
    const { name, email, phone, professionalId, tenantSlug } = body as {
      name?: string
      email?: string
      phone?: string
      professionalId?: string
      tenantSlug?: string
    }

    if (!email || !name || !professionalId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, email, professionalId' },
        { status: 400 },
      )
    }

    // 3) Pega tenantSlug do caller (se não veio no body) — vai ser herdado pro convidado
    const callerTenantSlug =
      tenantSlug ?? (sessionClaims?.metadata as Record<string, string> | undefined)?.tenantSlug

    // 4) Envia convite via Clerk
    const client = await clerkClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'

    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${appUrl}/profissional/agenda`,
      publicMetadata: {
        role: 'barbeiro',
        professionalId,
        professionalName: name,
        professionalPhone: phone ?? '',
        tenantSlug: callerTenantSlug ?? '',
      },
      // notify: true (default) → Clerk envia email automaticamente
    })

    // Persiste o email no Professional. Sem isso, recursos que precisam
    // achar o Clerk user (como /reset-password) não conseguem fazer
    // o join professional → conta. updateMany ignora se o id não existir.
    try {
      await prisma.professional.updateMany({
        where: { id: professionalId },
        data: { email },
      })
    } catch (persistErr) {
      console.warn('[INVITE] convite enviado mas falhou ao gravar email no Professional', persistErr)
    }

    return NextResponse.json({
      invitationId: invitation.id,
      status: invitation.status,
      message: `Convite enviado para ${email}`,
    })
  } catch (err) {
    console.error('[PROFESSIONAL_INVITE_ERROR]', err)
    const message = err instanceof Error ? err.message : 'Erro interno'
    // Erros comuns do Clerk: email já tem conta, email inválido
    if (message.includes('already')) {
      return NextResponse.json(
        { error: 'Este email já tem conta no sistema. Peça pro profissional fazer login direto.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
