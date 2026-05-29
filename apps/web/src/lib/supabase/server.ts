// Cliente Supabase pro servidor (Server Components, Route Handlers).
// Lê/escreve a sessão via cookies do Next (next/headers).
//
// Fase 3 — login único. Usar em rotas de API e server components que antes
// chamavam auth()/currentUser() do Clerk.

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Chamado de um Server Component (sem permissão de escrever cookie).
            // OK ignorar — o middleware (updateSession) renova a sessão.
          }
        },
      },
    },
  )
}

/**
 * Atalho: retorna o usuário logado (ou null) no server-side.
 * Substitui o `auth()`/`currentUser()` do Clerk.
 */
export async function getServerUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Resolve o registro User (Prisma) do usuário Supabase logado.
 * Match por supabaseId (preferencial) com fallback por email (chave de
 * unificação). Substitui os `where: { user: { clerkId: userId } }`.
 */
export async function getCurrentDbUser() {
  const { prisma } = await import('@stylogestor/database')
  const user = await getServerUser()
  if (!user) return null

  const orConditions: Array<Record<string, string>> = [{ supabaseId: user.id }]
  if (user.email) orConditions.push({ email: user.email })

  return prisma.user.findFirst({ where: { OR: orConditions } })
}
