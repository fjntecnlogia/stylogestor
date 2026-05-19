import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Guard pra rotas /api/* do admin. Garante que quem chama:
 *   1. Está logado no Clerk
 *   2. É super_admin (email no allowlist ADMIN_EMAILS OU role=super_admin)
 *
 * Uso:
 *   const guard = await requireAdmin()
 *   if (guard instanceof NextResponse) return guard
 *   // ... aqui já está autorizado
 *
 * Sem isso, /api/tenants e /api/stats são públicas — qualquer um
 * com a URL pega lista completa de barbearias e MRR do sistema.
 */
export async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const user = await currentUser()
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role

  if (role === 'super_admin') return null
  const allowlist = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (email && allowlist.includes(email.toLowerCase())) return null

  return NextResponse.json(
    { error: 'Acesso negado — somente super_admin' },
    { status: 403 },
  )
}
