// Helper de sessão Supabase pro middleware (Edge runtime).
//
// Renova a sessão (refresh token) e devolve { user, response }. NÃO usa Prisma
// (Edge não suporta). Dados de autorização (role, subscriptionStatus, tenantSlug)
// vêm do `app_metadata` do JWT — o backend popula isso no script de migração e
// mantém sincronizado (ver docs/WEB_FASE3_HANDOFF.md).

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

export async function updateSession(request: NextRequest): Promise<{
  user: User | null
  response: NextResponse
}> {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANTE: getUser() revalida o token no servidor Supabase (não confiar
  // só no cookie). É o que mantém a sessão fresca no Edge.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { user, response }
}

// Lê os claims de autorização do app_metadata (populado pelo backend).
export type AuthClaims = {
  role?: string // 'gestor' | 'barbeiro'
  subscriptionStatus?: string // 'active' | 'trial' | 'past_due' | 'canceled' | 'unpaid'
  tenantSlug?: string
}

export function readClaims(user: User | null): AuthClaims {
  const meta = (user?.app_metadata ?? {}) as Record<string, unknown>
  return {
    role: meta.role as string | undefined,
    subscriptionStatus: meta.subscriptionStatus as string | undefined,
    tenantSlug: meta.tenantSlug as string | undefined,
  }
}
