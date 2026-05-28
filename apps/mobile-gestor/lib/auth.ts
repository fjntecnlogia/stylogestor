// Hook de autenticação Supabase, similar ao useAuth/useUser do Clerk.
// Provê { user, session, isLoaded, signIn, signUp, signOut } via Context.
//
// Uso:
//   No _layout.tsx: <AuthProvider>{children}</AuthProvider>
//   Em qualquer screen: const { user, isSignedIn } = useAuth()

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

    // 1) Recupera sessão persistida no SecureStore (se houver)
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setIsLoaded(true)
    })

    // 2) Escuta mudanças (login, logout, refresh token)
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

// Compatibilidade: nas telas que só queriam o user
export function useUser() {
  const { user, isLoaded } = useAuth()
  return { user, isLoaded }
}
