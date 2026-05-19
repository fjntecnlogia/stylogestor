import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Admin SaaS é uma área restritíssima — só o(s) dono(s) da operação
 * podem entrar. Duas formas de liberar acesso (qualquer uma libera):
 *
 *   1. Email na env ADMIN_EMAILS (comma-separated, ex: "fjn@x.com,dev@y.com")
 *   2. publicMetadata.role === 'super_admin' no Clerk user
 *
 * Sem nenhuma das duas → mostra página "Acesso negado". Mesmo logado.
 *
 * As rotas /sign-in e /sign-up são públicas (auth do Clerk). Tudo o
 * mais (UI + /api/*) exige super_admin.
 */

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/acesso-negado(.*)',
])

function isSuperAdmin(email: string | null | undefined, role: string | undefined) {
  if (role === 'super_admin') return true
  if (!email) return false
  const allowlist = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowlist.includes(email.toLowerCase())
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const url = request.nextUrl.clone()

  if (isPublicRoute(request)) return NextResponse.next()

  // Exige login
  const { userId, sessionClaims } = await auth.protect()

  const metadata = (sessionClaims?.metadata as Record<string, string> | undefined) ?? {}
  const email =
    (sessionClaims?.email as string | undefined) ??
    (sessionClaims?.primary_email_address as string | undefined) ??
    null

  if (!isSuperAdmin(email, metadata.role)) {
    url.pathname = '/acesso-negado'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
