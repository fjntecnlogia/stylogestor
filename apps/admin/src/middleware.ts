import { clerkMiddleware, clerkClient, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Admin SaaS é uma área restritíssima — só o(s) dono(s) da operação
 * podem entrar. Duas formas de liberar acesso (qualquer uma libera):
 *
 *   1. Email na env ADMIN_EMAILS (comma-separated)
 *   2. publicMetadata.role === 'super_admin' no Clerk user
 *
 * Sem nenhuma das duas → mostra página "Acesso negado". Mesmo logado.
 *
 * IMPORTANTE: O Custom Session Token do Clerk só inclui `metadata` —
 * o email NÃO está no sessionClaims. Por isso buscamos via
 * clerkClient.users.getUser(userId) quando precisamos validar o email.
 * Isso adiciona 1 chamada à API do Clerk por request — aceitável pra
 * um admin de baixo tráfego. Pra evitar a chamada, basta o usuário
 * adicionar `"email": "{{user.primary_email_address}}"` no Custom
 * Session Token do Clerk Dashboard — o middleware já tenta ler do
 * token primeiro.
 *
 * As rotas /login e /sign-up são públicas (auth do Clerk). Tudo o
 * mais (UI + /api/*) exige super_admin.
 */

const isPublicRoute = createRouteMatcher([
  // O Clerk Dashboard (organização) está configurado com sign-in URL = /login
  // — mesma rota que o web usa. Sem incluir aqui, auth.protect() entra em
  // loop infinito de redirect e o browser estoura HTTP 431.
  '/login(.*)',
  '/sign-up(.*)',
  '/acesso-negado(.*)',
  // /api/health é pingado pelo próprio painel admin (self) e por outros
  // monitoramentos externos. Sem auth.
  '/api/health',
])

function isAllowlisted(email: string | null | undefined) {
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

  // Quick win: se role já é super_admin no session token, libera sem
  // chamar a API do Clerk.
  if (metadata.role === 'super_admin') return NextResponse.next()

  // Tenta ler email direto do session token (caso o Custom Session
  // Token tenha sido configurado pra incluir email).
  let email: string | null | undefined =
    (sessionClaims?.email as string | undefined) ??
    (sessionClaims?.primary_email_address as string | undefined) ??
    null

  // Fallback: busca o user na API do Clerk pra pegar email. Necessário
  // enquanto o Custom Session Token só inclui metadata.
  if (!email && userId) {
    try {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        null
      // Aproveita pra checar role do publicMetadata fresh — caso tenha
      // sido setado depois do session token atual ter sido emitido.
      const freshRole = (user.publicMetadata as { role?: string } | undefined)?.role
      if (freshRole === 'super_admin') return NextResponse.next()
    } catch (err) {
      console.error('[admin-middleware] failed to fetch user', err)
    }
  }

  if (isAllowlisted(email)) return NextResponse.next()

  url.pathname = '/acesso-negado'
  return NextResponse.rewrite(url)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
