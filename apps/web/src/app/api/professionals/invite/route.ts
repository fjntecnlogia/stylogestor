import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'
import { prisma } from '@stylogestor/database'

/**
 * POST /api/professionals/invite
 *
 * Chamado pelo gestor ao cadastrar um profissional novo. Cria a conta de
 * login do barbeiro + envia o convite.
 *
 * ⚠️ Fase 3 (Clerk→Supabase): criar conta de outro usuário exige a SERVICE
 * ROLE do Supabase, que (por decisão) fica SÓ no backend. Então a criação da
 * conta do barbeiro deve virar um endpoint NestJS (TODO: POST /professionals/
 * invite — `auth.admin.inviteUserByEmail` + app_metadata role:'barbeiro',
 * professionalId, tenantSlug). Aqui no web persistimos o email no Professional
 * (pra o join funcionar depois) e retornamos 501 enquanto o endpoint não existe.
 */
export async function POST(req: NextRequest) {
  try {
    // 1) Confirma que quem chama é um gestor logado
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Backend grava role='owner' pro gestor; só 'barbeiro' é restrito.
    const callerRole = (user.app_metadata as { role?: string } | undefined)?.role
    if (callerRole === 'barbeiro') {
      return NextResponse.json({ error: 'Apenas gestores podem convidar profissionais' }, { status: 403 })
    }

    // 2) Validação do body
    const body = await req.json()
    const { email, name, professionalId } = body as {
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

    // 3) Persiste o email no Professional (web pode — é só DB). Sem isso o
    // join professional → conta não funciona depois.
    try {
      await prisma.professional.updateMany({
        where: { id: professionalId },
        data: { email },
      })
    } catch (persistErr) {
      console.warn('[INVITE] falhou ao gravar email no Professional', persistErr)
    }

    // 4) Criação da conta de login do barbeiro → backend (service role).
    return NextResponse.json(
      {
        error:
          'Convite de profissional está sendo migrado para o novo sistema de login. ' +
          'Em breve. Por enquanto o profissional pode ser cadastrado, mas o acesso ' +
          'dele ao painel será liberado após a atualização.',
        pending: 'backend-endpoint',
      },
      { status: 501 },
    )
  } catch (err) {
    console.error('[PROFESSIONAL_INVITE_ERROR]', err)
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
