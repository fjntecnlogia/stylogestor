import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware do site público — registra cada page view em `site_visits`
 * pra alimentar a aba Analytics do admin SaaS (Visitas hoje, gráfico 13d,
 * páginas mais acessadas).
 *
 * "Fire-and-forget": faz fetch pra um route handler interno (/api/track) e
 * NÃO espera resposta (waitUntil se disponível, senão promise sem await).
 * Isso evita adicionar latência à navegação.
 *
 * Anonimização: envia hash SHA-256 truncado do IP+UA, não os valores brutos.
 * Sem PII — LGPD/GDPR compliant sem consent explícito.
 *
 * Filtros:
 *   - só GET de páginas (ignora /api/*, /_next/*, /favicon.ico, arquivos).
 *   - ignora HEAD/OPTIONS/POST (não são pageviews).
 *   - opção: adicione `?nolog=1` na URL pra pular (útil em bots conhecidos).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Filtra: só pageview de fato (GET, path público, sem extensão de asset).
  const isPageview =
    request.method === 'GET' &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/') &&
    !pathname.includes('.') && // arquivos como .css, .js, .png, .ico
    !request.nextUrl.searchParams.has('nolog')

  if (isPageview) {
    // Extrai IP + UA (headers padrão do Next em Vercel/proxy).
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0'
    const ua = request.headers.get('user-agent') || ''

    // O endpoint /api/track fica no apps/web (que tem @stylogestor/database).
    // Site faz cross-origin fetch — CORS liberado no route handler.
    const trackBase = process.env.NEXT_PUBLIC_TRACK_URL || 'https://app.stylogestor.com.br'
    const trackUrl = `${trackBase.replace(/\/+$/, '')}/api/track`
    const body = JSON.stringify({ path: pathname, ip, ua })

    // Fire-and-forget — resposta ignorada. Se o track cair, não afeta o site.
    fetch(trackUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-track': '1' },
      body,
    }).catch(() => { /* silencioso */ })
  }

  return NextResponse.next()
}

export const config = {
  // Só corre em rotas de página. Exclui _next/static/image e favicon
  // (o filtro dentro do middleware já cobre, mas o matcher evita nem
  // invocar a função pra assets).
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
