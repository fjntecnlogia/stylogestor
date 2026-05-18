/**
 * Inicialização do Sentry — DEVE ser o primeiro import em main.ts.
 *
 * Por que arquivo separado:
 *   O Sentry precisa instrumentar Node antes de qualquer outro pacote (HTTP,
 *   Express, Prisma) ser carregado. Se não, traces e contexto perdem dados.
 *   Ler `import './instrument'` ANTES de qualquer outro import no main.ts.
 *
 * Por que `dotenv/config` antes:
 *   Sentry.init roda em tempo de IMPORT (antes do bootstrap do Nest).
 *   ConfigModule.forRoot() do Nest só carrega .env depois de NestFactory.create.
 *   Então precisamos carregar manualmente o .env aqui.
 *
 * Sem SENTRY_DSN no .env → Sentry desativa silenciosamente (não quebra dev).
 */
import 'dotenv/config'
import * as Sentry from '@sentry/nestjs'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Sample rate: 100% em dev, 20% em prod (controla volume de eventos)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Identifica releases (se CI setar SENTRY_RELEASE no env)
    release: process.env.SENTRY_RELEASE,
    // Não enviar PII automaticamente (LGPD)
    sendDefaultPii: false,
    // Filtros: ignorar erros conhecidos/esperados
    ignoreErrors: [
      // Erros de validação de webhook (esperados — eventos de teste)
      'Assinatura inválida',
      'Headers svix ou body ausentes',
    ],
  })
}
