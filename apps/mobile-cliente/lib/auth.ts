// Hook de autenticação Supabase pro mobile-cliente.
// IMPORTANTE: no cliente, auth é OPCIONAL. As telas funcionam mesmo sem
// estar logado — login destrava histórico, perfil persistente e benefícios.
// Por isso AuthProvider NÃO bloqueia renderização; apenas expõe estado.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createElement } from 'react'
import type { Session, User, AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthState = {
  session: Session | null
  user: User | null
  isLoaded: boolean
  isSignedIn: boolean
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setIsLoaded(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      setIsLoaded(true)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    isLoaded,
    isSignedIn: !!session,
    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      return { error }
    },
  }

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser chamado dentro de <AuthProvider>')
  }
  return ctx
}

export function useUser() {
  const { user, isLoaded } = useAuth()
  return { user, isLoaded }
}
