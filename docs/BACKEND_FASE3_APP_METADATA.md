# Backend — dependência da Fase 3: popular `app_metadata` no Supabase

> **Para:** backend. **De:** time web (migração Clerk→Supabase em andamento).
> **Bloqueia:** o gate de assinatura e o role-routing do **middleware do web**.

## ✅ STATUS 28/05 — contrato de claims ALINHADO
Backend entregou `SupabaseMetadataService` (`setAppMetadata`/`updateSubscription`,
no-op sem service role, merge shallow). Onboarding grava `role='owner'` +
`tenantSlug` + `subscriptionStatus='trial'`; webhook Stripe faz dual-write.
- **Nomes batem:** web lê `role` / `subscriptionStatus` / `tenantSlug` — idênticos. ✅
- **Valores:** `trial|active|past_due|canceled` — web bloqueia `past_due`/`canceled`. ✅
- **`role='owner'`:** web trata tudo ≠ `'barbeiro'` como gestor (middleware + rotas
  invite/reset-password ajustadas pra bloquear só `barbeiro`). ✅
- **Ainda NÃO no metadata sync (web lê, degrada se faltar):**
  `tenantName` (saudação do dashboard — nice-to-have, backend tem `tenant.name` no
  onboarding, é 1 linha no `setAppMetadata`), `professionalId`/`professionalName`
  (setar no **endpoint de invite do barbeiro**), `tourCompleted` (flag de UI — minor).
- **⚠️ Gap de onboarding pelo WEB:** o `POST /api/tenants` do **Next** (onboarding
  web) faz as escritas no banco direto e NÃO dispara o `SupabaseMetadataService`.
  Só o `POST /tenants` do **NestJS** (usado pelo mobile) seta o metadata. Decidir no
  cutover: ou o web passa a chamar o NestJS, ou ganha um endpoint pra setar metadata,
  ou aceita degradação (middleware trata role indefinido como gestor; metadata é
  preenchido no 1º evento Stripe). Não bloqueia build/uso básico.

## Por que

O middleware do Next roda no **Edge runtime**, onde **não dá pra usar Prisma**. Hoje
(Clerk) ele lê 3 campos do `sessionClaims.metadata` **sem tocar no banco**:

- `role` — `'gestor'` | `'barbeiro'` (role-routing: barbeiro só acessa `/profissional/*`)
- `subscriptionStatus` — `'active'|'trial'|'past_due'|'canceled'|'unpaid'` (bloqueia inadimplente → `/bloqueado`)
- `tenantSlug` — slug da barbearia ativa

No Supabase, o equivalente que o Edge alcança via JWT é o **`app_metadata`** do usuário.
O web já está lendo `user.app_metadata.{role,subscriptionStatus,tenantSlug}`
(`apps/web/src/lib/supabase/middleware.ts` → `readClaims`). **Falta o backend popular isso.**

### ⚠️ Conjunto COMPLETO de chaves do `app_metadata` que o web lê
Além das 3 do middleware, os componentes/rotas leem mais campos (todos vinham do
`publicMetadata` do Clerk). Precisam TODOS ir pro `app_metadata`:

| chave | tipo | usado em | origem no banco |
|---|---|---|---|
| `role` | `'gestor'\|'barbeiro'` | middleware, invite, reset-password | `TenantUser.role` (mapear) |
| `subscriptionStatus` | string | middleware (gate) | `Subscription.status` |
| `tenantSlug` | string | middleware, configurações, invite | `Tenant.slug` |
| `tenantName` | string | dashboard, stripe/connect | `Tenant.name` |
| `professionalId` | string | painéis do barbeiro, blocks | `Professional.id` (do barbeiro vinculado) |
| `professionalName` | string | shell do barbeiro | `Professional.name` |
| `tourCompleted` | boolean | dashboard-tour | flag de UI (web grava — ver abaixo) |

> `tourCompleted` e `onboarding` são gravados pelo PRÓPRIO web em runtime (rotas
> `me/tour-completed`, `me/reset-onboarding`). Pra isso o web precisa de um
> **Supabase admin client (service role)** — ver "Escrita de metadata" abaixo.

### Escrita de metadata / contas — DECIDIDO: endpoints no backend
**Decisão (28/05, com o time):** o web **NÃO** terá service role. As operações
admin (escrever `app_metadata`, criar/gerenciar contas de barbeiro) **viram
endpoints no backend NestJS** (que já tem service role). O web só chama a API
autenticado (Bearer JWT Supabase + `x-tenant-slug`).

**Endpoints que o backend precisa criar** (o web já vai chamá-los; hoje essas
rotas no web usam `clerkClient`):

| Operação (rota web hoje) | Endpoint sugerido no backend | O que faz |
|---|---|---|
| `me/tour-completed` | `PATCH /me/tour-completed` | seta `app_metadata.tourCompleted=true` |
| `me/reset-onboarding` | `POST /me/reset-onboarding` | desvincula TenantUser + limpa `app_metadata` (tenantSlug etc) |
| `POST /tenants` (onboarding) | já existe (`POST /tenants`) — só garantir que **popula `app_metadata`** (role/tenantSlug/tenantName/subscriptionStatus) do criador | onboarding |
| `professionals/invite` | `POST /professionals/invite` | cria conta Supabase do barbeiro (`auth.admin`) + TenantUser role=barbeiro + `app_metadata.{role:'barbeiro',professionalId,professionalName,tenantSlug}` |
| `professionals/[id]/reset-password` | `POST /professionals/:id/reset-password` | gera link/reset de senha do barbeiro (`auth.admin`) |
| `professional-blocks` (lê `professionalId` do metadata do caller) | resolver `professionalId` via JWT `app_metadata` (já no token) ou `GET /me` | — |
| `cron/trial-warnings` (lia e-mails via clerkClient) | usar `User.email` do banco (Prisma) — **não precisa de Clerk nem service role** | enviar avisos |

> Enquanto esses endpoints não existem, as rotas web correspondentes ficam com
> a auth do caller migrada (não quebram o build), mas a operação admin fica
> como TODO chamando o endpoint futuro. As rotas "simples" (relatórios, checkout,
> stripe/portal, whatsapp, notifications, me/cash-closure, me/debug) já funcionam
> 100% sem backend novo.

> Usamos `app_metadata` (não `user_metadata`) de propósito: `app_metadata` só é
> gravável pelo service role (admin), o usuário não consegue forjar role/assinatura.

## O que precisa ser feito

### 1. No script de migração `migrate:clerk-supabase`
Ao criar/linkar cada conta Supabase, gravar no `app_metadata`:
```ts
await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
  app_metadata: {
    role: tenantUser.role === 'barbeiro' ? 'barbeiro' : 'gestor', // mapear do TenantUser.role
    subscriptionStatus: subscription?.status ?? 'trial',
    tenantSlug: tenant.slug,
  },
})
```
> Atenção ao mapeamento de `role`: hoje `TenantUser.role` default é `"owner"`.
> Definir a regra (owner/gestor → `'gestor'`; convidado barbeiro → `'barbeiro'`).

### 2. No cadastro novo (signup) e no onboarding (`POST /tenants`)
Quando uma barbearia é criada/vinculada, setar o `app_metadata` do usuário
(`role: 'gestor'`, `tenantSlug`, `subscriptionStatus: 'trial'`).

### 3. Sincronização contínua (webhook Stripe)
Quando a assinatura muda (Stripe webhook que já atualiza `Subscription.status` no
banco), atualizar **também** o `app_metadata.subscriptionStatus` do(s) usuário(s)
do tenant via `auth.admin.updateUserById`. Senão o web não bloqueia/desbloqueia.

### 4. (Opcional, recomendado) trocar de tenant
Se um user tem vários tenants, definir como o `tenantSlug` ativo é escolhido/trocado
(hoje no Clerk era setado no metadata). Pode ficar pra depois — o fallback do web
resolve via banco em server-side, só o middleware Edge depende do metadata.

## Como o web valida

- Middleware: `readClaims(user)` lê `user.app_metadata.{role,subscriptionStatus,tenantSlug}`.
- Server-side (`auth-tenant.ts`): se `app_metadata.tenantSlug` faltar, faz fallback
  por `supabaseId`/`email` no banco — então server components/rotas funcionam mesmo
  sem o metadata, **mas o middleware (Edge) não bloqueia inadimplente sem ele**.

## Checklist de cutover (recap do WEB_FASE3_HANDOFF.md)
1. Web implementado + validado em staging (login/cadastro/reset/role/gate). ⬅️ em andamento
2. **Este doc:** script popula `app_metadata` + Stripe webhook sincroniza.
3. Rodar `migrate:clerk-supabase --dry-run` → revisar → real.
4. Deploy web Supabase + e-mail "redefina sua senha" pros migrados.
5. `AUTH_MODE=supabase-only`.
6. Validar: mesmo e-mail loga web **e** app, mesmo tenant.
