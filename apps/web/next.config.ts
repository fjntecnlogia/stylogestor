import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from "next";

// Nota: o ambiente atual da VPS usa PM2 + `next start` (não Docker standalone).
// Se voltarmos a usar Docker no futuro, reativar `output: "standalone"` +
// `outputFileTracingRoot` apontando pra raiz do monorepo, E garantir que o
// Dockerfile copia `.next/static` e `public` pra dentro do standalone.
const nextConfig: NextConfig = {};

// Wrapper do Sentry: instrumenta build do Next, faz upload de source maps,
// tunnel pra contornar ad-blockers, e bundles automatizados.
//
// Sem SENTRY_AUTH_TOKEN/ORG/PROJECT no env, source map upload é skipado
// (build continua, mas stack traces em prod ficam minified).
export default withSentryConfig(nextConfig, {
  // Org/project do Sentry — leitura via env (opcional)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Silencia logs do plugin (mostra apenas erros)
  silent: !process.env.CI,

  // Upload de source maps SÓ em produção (dev fica fast)
  sourcemaps: {
    disable: process.env.NODE_ENV !== 'production',
    // Apaga source maps locais após upload (não ficam no bundle público)
    deleteSourcemapsAfterUpload: true,
  },

  // Tunnel route — bypassa ad-blockers que bloqueiam *.sentry.io
  // Eventos passam por /monitoring que vai pra Sentry
  tunnelRoute: '/monitoring',

  // Telemetria desabilitada (privacidade)
  telemetry: false,
})
