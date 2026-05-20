import { NextResponse } from 'next/server'

/**
 * GET /api/health — health check pro painel admin pingar.
 *
 * Retorna versão (commit SHA) e data de build pra mostrar o que está
 * rodando em prod. Quando o painel /admin (sistema) chama, mostra o
 * commit curto + horário do build de cada app lado-a-lado.
 *
 * Endpoint público (sem auth). Não expõe nada sensível — só app name +
 * commit + build time. CORS aberto pra o admin (subdomínio diferente)
 * poder fetchar do navegador.
 *
 * Variáveis lidas (setadas no GitHub Actions / deploy-pm2.sh):
 *   - NEXT_PUBLIC_GIT_SHA (commit que gerou esse build)
 *   - NEXT_PUBLIC_BUILD_TIME (ISO timestamp do build)
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      name: 'stylo-web',
      version: process.env.NEXT_PUBLIC_GIT_SHA || 'unknown',
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || null,
      now: new Date().toISOString(),
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    },
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
    },
  })
}
