import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

/**
 * POST /api/me/tour-completed
 * Marca `tourCompleted=true` no publicMetadata do usuário Clerk —
 * usado pelo <DashboardTour /> pra não rodar o passeio de novo.
 */
export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const client = await clerkClient()
    const existing = await client.users.getUser(userId)
    const existingMetadata = (existing.publicMetadata as Record<string, unknown>) ?? {}

    await client.users.updateUserMetadata(userId, {
      publicMetadata: { ...existingMetadata, tourCompleted: true },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[TOUR_COMPLETED_ERROR]', error)
    return NextResponse.json({ error: 'Erro ao salvar status do tour' }, { status: 500 })
  }
}
