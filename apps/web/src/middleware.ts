import { NextResponse, type NextRequest } from 'next/server'
import { updateSession, readClaims } from './lib/supabase/middleware'

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'stylogestor.com.br'

const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'cdn', 'admin', 'mail',
  'smtp', 'ftp', 'localhost', 'staging', 'dev',
])

// Matcher de rota simples (substitui o createRouteMatcher do Clerk).
// Os padrões usam `(.*)` no fim como curinga, igual aos do Clerk.
function routeMatcher(patterns: string[]) {
  const regexes = patterns.map(
    (p) => new RegExp(`^${p.replace(/\(\.\*\)/g, '.*')}$`),
  )
  return (pathname: string) => regexes.some((r) => r.test(pathname))
}

const isPublicRoute = routeMatcher([
  '/login(.*)',
  '/cadastro(.*)',
  '/recuperar-senha(.*)',         // pedir reset de senha (página nova)
  '/redefinir-senha(.*)',         // definir nova senha após o link do e-mail
  '/onboarding(.*)',
  '/sucesso(.*)',
  '/bloqueado(.*)',
  '/api/webhooks(.*)',
  '/api/whatsapp/webhook(.*)',    // WhatsApp webhook — sem auth
  '/api/whatsapp/qr(.*)',        // QR code endpoint
  '/api/tenants(.*)',            // Onboarding create tenant
  '/api/notifications(.*)',      // Email notifications
  '/api/automations(.*)',        // Automações — chamadas internamente
  '/api/cron(.*)',               // Cron jobs — autenticados via CRON_SECRET
  '/api/v1/tenants/by-slug(.*)',
  '/api/v1/booking(.*)',         // Booking público — cliente final agenda sem login
  '/b/(.*)',                     // Landing pública de agendamento
  '/api/health',                 // Health check pro painel admin pingar
  '/api/track',                  // Site público (analytics) posta pageviews aqui
  '/api/debug/(.*)',             // Endpoints de debug temporários
  '/reset-conta(.*)',            // Página de recuperação (tenant fantasma)
])

// Rotas permitidas mesmo sem assinatura ativa
const isPaymentRoute = routeMatcher([
  '/planos(.*)',
  '/sucesso(.*)',
  '/bloqueado(.*)',
  '/ajuda(.*)',
  '/suporte(.*)',
  // Endpoints de pagamento — sem isso o middleware redireciona pra /bloqueado
  // antes do fetch chegar no route handler, e o Stripe Checkout nunca abre.
  '/api/checkout(.*)',
  '/api/stripe(.*)',
  '/api/me/redeem-code(.*)',
])

// Rotas exclusivas do painel do profissional (barbeiro)
const isProfessionalRoute = routeMatcher([
  '/profissional(.*)',
])

// Rotas exclusivas do gestor (dashboard, clientes, financeiro etc)
const isGestorRoute = routeMatcher([
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

// Copia os cookies (sessão renovada pelo updateSession) pra uma nova resposta
// (redirect/rewrite), pra não perder o refresh do token.
function withSessionCookies(target: NextResponse, from: NextResponse): NextResponse {
  from.cookies.getAll().forEach((c) => target.cookies.set(c))
  return target
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const subdomain = extractSubdomain(hostname, BASE_DOMAIN)

  // ── Subdomínio de tenant (booking público) — não precisa de sessão ──
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

  // ── Renova a sessão Supabase (mantém cookies frescos) e pega o user ──
  const { user, response } = await updateSession(request)

  // Rotas públicas — sem auth (mas já com cookies renovados)
  if (isPublicRoute(url.pathname)) return response

  // Exige autenticação
  if (!user) {
    url.pathname = '/login'
    return withSessionCookies(NextResponse.redirect(url), response)
  }

  const { role, subscriptionStatus } = readClaims(user)

  // ───────────────────────────────────────────────────────────────
  // Role-based routing: barbeiro só acessa /profissional/*
  // Gestor (ou sem role definida) acessa o painel padrão e NÃO entra
  // em /profissional/*.
  // ───────────────────────────────────────────────────────────────
  if (role === 'barbeiro') {
    if (isGestorRoute(url.pathname)) {
      url.pathname = '/profissional/agenda'
      return withSessionCookies(NextResponse.redirect(url), response)
    }
    if (url.pathname === '/') {
      url.pathname = '/profissional/agenda'
      return withSessionCookies(NextResponse.redirect(url), response)
    }
  } else {
    if (isProfessionalRoute(url.pathname)) {
      url.pathname = '/dashboard'
      return withSessionCookies(NextResponse.redirect(url), response)
    }
  }

  // Verificar status da assinatura (vem do app_metadata do Supabase).
  // 'expired' = trial cujo trialEndsAt já passou — populado pelo cron diário
  // /api/cron/expire-trials. Sem isso, trial vencido continua usando o sistema.
  const blockedStatuses = ['expired', 'past_due', 'canceled', 'unpaid']
  if (
    subscriptionStatus &&
    blockedStatuses.includes(subscriptionStatus) &&
    !isPaymentRoute(url.pathname)
  ) {
    url.pathname = '/bloqueado'
    return withSessionCookies(NextResponse.redirect(url), response)
  }

  return response
}

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
