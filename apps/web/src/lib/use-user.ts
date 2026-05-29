'use client'

// Hook de usuário client-side (substitui o useUser do Clerk).
// Retorna { user, isLoaded } onde `user` é o User do Supabase:
//   - user.id            → id do usuário (Supabase)
//   - user.email
//   - user.app_metadata  → role, subscriptionStatus, tenantSlug, tenantName,
//                          professionalId, professionalName, tourCompleted
//                          (populados pelo backend — ver docs/BACKEND_FASE3_APP_METADATA.md)
//   - user.user_metadata → name, avatar (perfil editável pelo próprio user)
//
// Onde antes lia `user.publicMetadata.X`, agora lê `user.app_metadata?.X`.

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from './supabase/client'

export function useUser(): { user: User | null; isLoaded: boolean } {
  const [user, setUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setIsLoaded(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoaded(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { user, isLoaded }
}

/** Helper de logout pro client (substitui useClerk().signOut()). */
export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.assign('/login')
}

/**
 * Renova a sessão pra pegar o app_metadata atualizado no JWT (substitui o
 * user.reload() do Clerk). Usar após uma ação server-side que muda metadata
 * (onboarding, resgate de código, tour concluído).
 */
export async function refreshUser(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.refreshSession()
}

// Atalho de leitura de app_metadata tipado.
export function appMeta(user: User | null): Record<string, unknown> {
  return (user?.app_metadata ?? {}) as Record<string, unknown>
}
