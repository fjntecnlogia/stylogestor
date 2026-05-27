import { NextResponse } from 'next/server'

/**
 * GET /api/debug/clerk-instance
 *
 * Retorna qual instância Clerk está configurada no app (live ou test)
 * + o domínio da frontend API. Útil pra confirmar do mobile:
 *   - "o web tá em LIVE?" → sim/não
 *   - "qual o frontend domain?" → ex.: clerk.stylogestor.com.br
 *
 * Sem informações secretas — `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` é
 * pública por definição (vai pro bundle do browser). Por isso o
 * endpoint não exige auth: qualquer um inspecionando o JS já tem
 * essa info de qualquer jeito.
 *
 * Formato da publishable key:
 *   pk_<environment>_<base64-domain>
 *   onde environment = 'live' ou 'test'
 *   e <base64-domain> decodifica pro frontend domain com sufixo '$'
 *
 * Exemplos:
 *   pk_live_Y2xlcmsuc3R5bG9nZXN0b3IuY29tLmJyJA → clerk.stylogestor.com.br
 *   pk_test_xxxxx                             → algo-blablah.clerk.accounts.dev
 */
export const dynamic = 'force-dynamic'

function decodeFrontendDomain(pk: string | undefined): string | null {
  if (!pk) return null
  // Formato: pk_live_<base64> ou pk_test_<base64>
  const match = pk.match(/^pk_(live|test)_(.+)$/)
  if (!match) return null
  const encoded = match[2]
  try {
    // Buffer disponível em Node runtime (esse endpoint é server-side)
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
    // O Clerk costuma terminar a string com '$' — tira pra ficar limpo
    return decoded.replace(/\$+$/, '')
  } catch {
    return null
  }
}

export async function GET() {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const hasSecret = Boolean(process.env.CLERK_SECRET_KEY)

  let environment: 'live' | 'test' | 'unknown' = 'unknown'
  if (pk?.startsWith('pk_live_')) environment = 'live'
  else if (pk?.startsWith('pk_test_')) environment = 'test'

  const frontendDomain = decodeFrontendDomain(pk)
  const secretEnv = process.env.CLERK_SECRET_KEY?.startsWith('sk_live_')
    ? 'live'
    : process.env.CLERK_SECRET_KEY?.startsWith('sk_test_')
      ? 'test'
      : 'unknown'

  return NextResponse.json(
    {
      app: 'stylo-web',
      environment, // 'live' | 'test' — derivado da PUBLISHABLE_KEY
      publishableKeyPrefix: pk ? `${pk.slice(0, 8)}…` : null, // só os 8 primeiros chars (ex.: pk_live_)
      frontendDomain, // ex.: clerk.stylogestor.com.br
      hasSecret,
      secretEnvMatchesPublishable: hasSecret ? secretEnv === environment : null,
      // Hint pra alinhar com mobile:
      hint:
        environment === 'live'
          ? 'Mobile precisa estar com pk_live_* (mesma instância) pra contas criadas aqui funcionarem.'
          : environment === 'test'
            ? 'ATENÇÃO: web está em TEST. Mobile em live não vai casar.'
            : 'Nenhuma publishable key configurada.',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
