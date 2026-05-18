# ⚙️ Session: BACKEND — API NestJS (`packages/api`)

> **Quem usa:** Dev Backend responsável pela API que sustenta web, admin, booking e os apps mobile.

## Escopo desta session
- API REST NestJS — única fonte da verdade.
- 8 módulos: `appointments`, `auth`, `clients`, `financial`, `notifications`, `professionals`, `subscriptions`, `tenants`.
- Integrações **hoje implementadas**:
  - Clerk (JWT + webhook svix de sincronização de usuário)
  - Stripe (cobrança — checkout + webhook idempotente)
  - Evolution API (WhatsApp)
- Integrações **planejadas mas ainda NÃO implementadas**: Pagar.me, Ultra MSG, Resend (email). Atualizar este doc ao implementar.

## Stack
- **NestJS** 10.4.17 + Express
- **Prisma** 6.8.2 (cliente; schema fica em `packages/database`)
- **TypeScript** 5.8
- **class-validator** + **class-transformer** (DTOs)
- **helmet** + `@nestjs/throttler` (security básico)
- **svix** (validação de webhooks)
- **Swagger** (`@nestjs/swagger`) — docs em `/api/docs`

## Comandos
```bash
pnpm --filter @stylogestor/api dev      # nest start --watch (porta padrão 3001)
pnpm --filter @stylogestor/api build    # SWC: ~200ms, gera dist/ pronto pra produção
pnpm --filter @stylogestor/api exec tsc --noEmit   # type-check completo (separado do build)
```

### Build: SWC + tsc

- **Build de produção**: `nest build` usa **SWC** (config em `.swcrc` + `nest-cli.json`).
  SWC só transpila, não faz type-check, gera CommonJS pronto pro Node.
- **Type-check**: feito via `tsc --noEmit` (usa `tsconfig.json` com `moduleResolution: bundler`
  para resolver tipos do Stripe v22 corretamente).

Em PRs, ambos rodam: `pnpm exec tsc --noEmit` para garantir tipos + `pnpm build` para
garantir que o output executa.

## Princípios não-negociáveis
1. 🔒 **Multi-tenant isolado**: TODO query Prisma filtra por `tenantId`. Sem exceção. Em updates/deletes por id, use `updateMany`/`deleteMany` com `where: { id, tenantId }` (não apenas `where: { id }`).
2. 🛡️ **Auth em duas camadas**:
   - `ClerkAuthGuard` registrado globalmente em `app.module.ts` — valida JWT e injeta `request.user`. Use `@Public()` para abrir webhooks/healthchecks/planos.
   - `TenantGuard` em rotas privadas — valida membership `TenantUser` antes de injetar `request.tenant`.
3. 📋 **DTO + validação**: todo `@Body()` é tipado por DTO com decorators de `class-validator`. Para PATCH, usar `PartialType` de `@nestjs/mapped-types` (não `Partial<>` cru — perde validação).
4. 🪝 **Webhooks idempotentes**: assinatura HMAC validada (svix/Stripe), persiste `eventId` em `webhook_events` (UNIQUE `provider+eventId`), `rawBody: true` no bootstrap, **propaga 5xx em falha de processamento** (provider re-tenta), **400 em assinatura inválida** (provider não re-tenta).
5. 💸 **Sem PII em log**: nada de telefone, CPF, email em `Logger.log`. Use mascaramento (ex: `NotificationsService.maskPhone`).
6. 🔁 **Transações**: operações multi-tabela em `prisma.$transaction([...])`. Para check-then-write (ex: overlap de agendamento), use `$transaction(async (tx) => {...}, { isolationLevel: Serializable })`.
7. ⛔ **Sem `any` nem `as never`**: tipagem rigorosa. Use `Prisma.XxxWhereInput` para `where` dinâmico.
8. 🧯 **Erros nunca engolidos**: nada de `.catch(() => null)` em writes do banco. Logue **e** re-lance — o cliente precisa saber, e webhooks precisam que o provider re-tente.

## NÃO toque
- ❌ `packages/database/prisma/schema.prisma` direto — pertence ao time DB (peça migration). Exceção: já foi adicionado `WebhookEvent` (idempotência de webhooks) com migration em `prisma/migrations/20260517_add_webhook_events/`.
- ❌ `apps/*` — você fornece a API, eles consomem.
- ❌ Adicionar dependências de UI (`react`, `next`, etc.).

## Estrutura
```
src/
├── main.ts               ← bootstrap (rawBody, helmet, CORS, Swagger)
├── app.module.ts         ← registra ClerkAuthGuard + ThrottlerGuard como APP_GUARD
├── common/
│   ├── decorators/       ← @CurrentTenant, @CurrentUser, @Public
│   ├── guards/           ← ClerkAuthGuard, TenantGuard
│   ├── interceptors/     ← TenantContextInterceptor (RLS via set_config)
│   └── prisma/           ← PrismaService + PrismaModule
└── modules/
    ├── appointments/
    ├── auth/             ← webhook svix do Clerk (idempotente)
    ├── clients/
    ├── financial/
    ├── notifications/    ← WhatsApp via Evolution API (Ultra MSG/Resend planejados)
    ├── professionals/
    ├── subscriptions/    ← Stripe (Pagar.me planejado)
    └── tenants/
```

## Antes de PR
1. `pnpm --filter @stylogestor/api exec tsc --noEmit` passa
2. Swagger atualizado (decorators `@ApiOperation`, `@ApiResponse`)
3. Subagent: invoque `backend-reviewer`
4. Se mexeu em schema: invoque `db-prisma-expert`

## Variáveis necessárias (.env)
Veja `.env.example` na raiz. Mínimas para funcionar **hoje**:
```
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=                # Bearer JWT (ClerkAuthGuard)
CLERK_WEBHOOK_SECRET=            # svix (webhook auth/sync)
STRIPE_SECRET_KEY=               # checkout + billing portal
STRIPE_WEBHOOK_SECRET=           # validação HMAC do webhook Stripe
INTERNAL_API_KEY=                # compartilhado com Next middleware (rota /tenants/by-slug, header x-internal-key)
EVOLUTION_API_URL=               # WhatsApp
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=stylogestor
NEXT_PUBLIC_APP_URL=             # success/cancel URL do Stripe checkout
```

Planejadas (ainda não usadas no código):
```
PAGARME_API_KEY=
PAGARME_WEBHOOK_SECRET=
ULTRAMSG_INSTANCE_ID=
ULTRAMSG_TOKEN=
RESEND_API_KEY=
```
