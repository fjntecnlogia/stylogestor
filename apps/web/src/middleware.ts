import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'stylogestor.com.br'

// Subdomínios reservados — não são tenants
const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'cdn', 'admin', 'mail',
  'smtp', 'ftp', 'localhost', 'staging', 'dev',
])

// Rotas públicas (sem auth necessária)
const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/cadastro(.*)',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''

  // Extrai o subdomínio
  const subdomain = extractSubdomain(hostname, BASE_DOMAIN)

  // Sem subdomínio → app principal (dashboard)
  if (!subdomain) {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
    return NextResponse.next()
  }

  // Subdomínio reservado → redireciona para app principal
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return NextResponse.redirect(new URL(`https://app.${BASE_DOMAIN}${url.pathname}`))
  }

  // Subdomínio de tenant → página de booking público
  // Busca tenant_id via API e injeta nos headers
  const tenantResponse = await fetchTenantBySlug(subdomain, request)

  if (!tenantResponse) {
    // Tenant não encontrado → 404
    url.pathname = '/not-found'
    return NextResponse.rewrite(url)
  }

  // Injeta headers para que Server Components acessem o tenant
  const response = NextResponse.next()
  response.headers.set('x-tenant-slug', subdomain)
  response.headers.set('x-tenant-id', tenantResponse.id)
  response.headers.set('x-tenant-name', tenantResponse.name)
  response.headers.set('x-tenant-plan', tenantResponse.plan)

  // Seta cookie para Client Components
  response.cookies.set('tenant_slug', subdomain, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hora
  })

  return response
})

function extractSubdomain(hostname: string, baseDomain: string): string | null {
  // localhost:3000 → sem subdomínio
  if (hostname.includes('localhost')) {
    return null
  }

  // Remove porta se houver
  const host = hostname.split(':')[0]

  // Verifica se é subdomínio do domínio base
  if (host.endsWith(`.${baseDomain}`)) {
    const sub = host.slice(0, -(baseDomain.length + 1))
    // Ignora subdomínios aninhados (a.b.stylogestor.com.br)
    if (sub.includes('.')) return null
    return sub
  }

  return null
}

async function fetchTenantBySlug(
  slug: string,
  request: NextRequest
): Promise<{ id: string; name: string; plan: string } | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/tenants/by-slug/${slug}`, {
      headers: { 'x-internal-key': process.env.INTERNAL_API_KEY || '' },
      // Cache de 60s para não bater na API em cada request
      next: { revalidate: 60 },
    })

    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export const config = {
  matcher: [
    // Aplica middleware em todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
