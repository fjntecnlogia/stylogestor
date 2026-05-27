import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'stylogestor.com.br'

const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'cdn', 'admin', 'mail',
  'smtp', 'ftp', 'localhost', 'staging', 'dev',
])

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/cadastro(.*)',
  '/onboarding(.*)',
  '/sucesso(.*)',
  '/bloqueado(.*)',
  '/api/webhooks(.*)',
  '/api/whatsapp/webhook(.*)',    // WhatsApp webhook — sem auth
  '/api/whatsapp/qr(.*)',        // QR code endpoint
  '/api/tenants(.*)',            // Onboarding create tenant
  '/api/notifications(.*)',      // Email notifications
  '/api/automations(.*)',        // Automações — chamadas internamente
  '/api/cron(.*)',               // Cron jobs — autenticados via CRON_SECRET, não Clerk
  '/api/v1/tenants/by-slug(.*)',
  '/api/v1/booking(.*)',         // Booking público — cliente final agenda sem login
  '/b/(.*)',                     // Landing pública de agendamento
  '/api/health',                 // Health check pro painel admin pingar
  '/api/debug/(.*)',             // Endpoints de debug temporários (instance, etc)
  '/reset-conta(.*)',            // Página de recuperação (tenant fantasma)
])

// Rotas permitidas mesmo sem assinatura ativa
const isPaymentRoute = createRouteMatcher([
  '/planos(.*)',
  '/sucesso(.*)',
  '/bloqueado(.*)',
  '/ajuda(.*)',
  '/suporte(.*)',
])

// Rotas exclusivas do painel do profissional (barbeiro)
const isProfessionalRoute = createRouteMatcher([
  '/profissional(.*)',
])

// Rotas exclusivas do gestor (dashboard, clientes, financeiro etc)
const isGestorRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/agenda(.*)',
  '/clientes(.*)',
  '/configuracoes(.*)',
  '/estoque(.*)',
  '/fidelidade(.*)',
  '/financeiro(.*)',
  '/fechamentos(.*)',
  '/profissionais(.*)',
  '/servicos(.*)',
  '/afiliados(.*)',
])

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const subdomain = extractSubdomain(hostname, BASE_DOMAIN)

  // Subdomínio de tenant (booking público)
  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    const tenantResponse = await fetchTenantBySlug(subdomain)
    if (!tenantResponse) {
      url.pathname = '/not-found'
      return NextResponse.rewrite(url)
    }
    const response = NextResponse.next()
    response.headers.set('x-tenant-slug', subdomain)
    response.headers.set('x-tenant-id', tenantResponse.id)
    response.headers.set('x-tenant-name', tenantResponse.name)
    response.headers.set('x-tenant-plan', tenantResponse.plan)
    return response
  }

  // Rotas públicas — sem auth
  if (isPublicRoute(request)) return NextResponse.next()

  // Exige autenticação
  const { userId, sessionClaims } = await auth.protect()

  const metadata = (sessionClaims?.metadata as Record<string, string> | undefined) ?? {}
  const role = metadata.role // 'gestor' | 'barbeiro' | undefined (assume gestor por retrocompat)

  // ───────────────────────────────────────────────────────────────
  // Role-based routing: barbeiro só acessa /profissional/*
  // Gestor (ou sem role definida) acessa o painel padrão e NÃO entra
  // em /profissional/*.
  // ───────────────────────────────────────────────────────────────
  if (role === 'barbeiro') {
    // Bloqueia barbeiro em rotas do gestor → redireciona pro painel dele
    if (isGestorRoute(request)) {
      url.pathname = '/profissional/agenda'
      return NextResponse.redirect(url)
    }
    // Se acessa raiz `/`, manda direto pro painel dele
    if (url.pathname === '/') {
      url.pathname = '/profissional/agenda'
      return NextResponse.redirect(url)
    }
  } else {
    // Gestor (ou role indefinida) não deve entrar em /profissional/*
    if (isProfessionalRoute(request)) {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Verificar status da assinatura (salvo no publicMetadata do Clerk)
  const subStatus = metadata.subscriptionStatus
  const blockedStatuses = ['past_due', 'canceled', 'unpaid']

  if (subStatus && blockedStatuses.includes(subStatus) && !isPaymentRoute(request)) {
    url.pathname = '/bloqueado'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

function extractSubdomain(hostname: string, baseDomain: string): string | null {
  if (hostname.includes('localhost')) return null
  const host = hostname.split(':')[0]
  if (host.endsWith(`.${baseDomain}`)) {
    const sub = host.slice(0, -(baseDomain.length + 1))
    if (sub.includes('.')) return null
    return sub
  }
  return null
}

async function fetchTenantBySlug(slug: string): Promise<{ id: string; name: string; plan: string } | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/v1/tenants/by-slug/${slug}`, {
      headers: { 'x-internal-key': process.env.INTERNAL_API_KEY || '' },
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
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
