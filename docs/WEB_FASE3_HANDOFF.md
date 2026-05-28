# Handoff Web — Fase 3: migrar login Clerk → Supabase (login único)

> **Para:** time Web (`apps/web`). **De:** backend.
> **Contexto completo:** `docs/AUTH_UNIFICATION.md`.
> **Objetivo:** o web passar a autenticar no **mesmo projeto Supabase que o app
> já usa**, para que uma única credencial funcione no web **e** no mobile.

## Por que (resumo)
Hoje web=Clerk, app=Supabase → senhas em IdPs diferentes. O `MultiAuthGuard` da
API já une a *identidade* por email (mesma pessoa = mesmo `User`/tenant), mas a
senha do app não existe no Clerk → "senha incorreta" no web. A correção é o web
sair do Clerk e logar no Supabase. **A API NestJS já aceita JWT Supabase** — não
precisa mudar nada no backend para o web funcionar.

## ✅ O que o backend já entregou (pronto pra vocês)
- **API aceita JWT Supabase** em todas as rotas (`MultiAuthGuard`). É só mandar
  `Authorization: Bearer <access_token do Supabase>` + `x-tenant-slug`.
- **`AUTH_MODE`** (env): `federated` (default, aceita Clerk+Supabase durante a
  transição) → `supabase-only` (recusa Clerk, ligado só no cutover). Permite
  rollback por env, sem redeploy.
- **Script de migração** `pnpm --filter @stylogestor/api run migrate:clerk-supabase`
  (cria as contas Supabase dos usuários Clerk e linka por email). Backend roda
  isso no cutover — vocês não precisam.
- Resolução slug→tenant (`GET /tenants/by-slug` + `x-internal-key`) **continua
  igual** — mantenham no middleware.

## ⚠️ Pré-requisitos (ops / antes do cutover)
1. Web aponta pro **mesmo projeto Supabase** do mobile (`SUPABASE_URL` =
   `ncxssdiottdvzdsdgvza.supabase.co`). É isso que funde as bases.
2. No Supabase: provider **email/senha** habilitado (já está, mobile usa) +
   **templates de e-mail** (confirmação/reset) + **SMTP próprio** (o SMTP default
   tem limite baixo e trava no disparo de reset em massa).
3. Login do web é **só email/senha** (confirmei: sem Google/OAuth) → migração
   mais simples, sem reconfigurar provedores sociais.

## 📋 O que o web precisa trocar (~39 arquivos tocam Clerk)

### Dependências
- Remover `@clerk/nextjs`; adicionar `@supabase/ssr` + `@supabase/supabase-js`.
- Envs novas no web: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  Remover as `*_CLERK_*` no fim (Fase 4).

### Crítico (caminho principal)
- [ ] `src/app/layout.tsx` — trocar `<ClerkProvider>` por provider/cliente Supabase (SSR).
- [ ] `src/middleware.ts` — proteção de rota via sessão Supabase (`@supabase/ssr`
      cookies) no lugar de `clerkMiddleware`. **Manter** a resolução slug→tenant
      e o gate de assinatura (hoje lê `sessionClaims.metadata.subscriptionStatus`
      do Clerk → trocar pela fonte equivalente).
- [ ] `src/app/(auth)/login/page.tsx` — `signInWithPassword`.
- [ ] `src/app/(auth)/cadastro/page.tsx` — `signUp`.
- [ ] **Esqueci a senha** (página nova) — `resetPasswordForEmail` (essencial: os
      usuários migrados do Clerk **não têm senha** no Supabase no 1º acesso).
- [ ] `src/lib/auth-tenant.ts` — helper de auth server-side (Clerk `auth()`/
      `currentUser()` → `supabase.auth.getUser()` via cookies).

### Rotas Next `src/app/api/*` que usam `auth()`/`currentUser()` server-side
Trocar pela leitura da sessão Supabase. São ~12:
`tenants`, `checkout`, `checkout/pix`, `stripe/connect/onboard`, `stripe/portal`,
`reports/dashboard`, `reports/financeiro`, `professional-blocks`,
`professionals/invite`, `professionals/[id]/reset-password`,
`me/reset-onboarding`, `me/tour-completed`, `me/cash-closure`, `me/debug`,
`notifications/email`, `whatsapp/send`, `cron/trial-warnings`.
> Obs.: várias dessas podem virar chamadas à API NestJS (Fase 2), mas isso é
> independente do login único — não bloqueia esta fase.

### Componentes que leem o usuário (`useUser`/`currentUser`)
Trocar por sessão Supabase: `components/layout/topbar`, `dashboard/trial-card`,
`dashboard/dashboard-tour`, `configuracoes/configuracoes-view`,
`promo/promo-code-input`, `onboarding/onboarding-flow`,
`profissional/*` (perfil, horários, fechamento, agenda, shell),
`(dashboard)/dashboard/page`, `(dashboard)/afiliados/page`, `reset-conta/page`.

## 🔁 Sequência de cutover (coordenada)
1. **(Web)** implementar tudo acima atrás de staging/preview, validando login,
   cadastro, reset, proteção de rota e o gate de assinatura.
2. **(Backend)** rodar `migrate:clerk-supabase --dry-run`, revisar, depois rodar real.
3. **(Cutover, janela de baixo tráfego)** deploy do web no Supabase + disparo do
   e-mail de "redefina sua senha" pros usuários migrados.
4. **(Backend)** após validar, `AUTH_MODE=supabase-only` (recusa Clerk).
5. **Validar:** mesmo email loga no web **e** no app, mesmo tenant/dados.
6. **(Fase 4)** remover `@clerk/*` do web, desativar webhook Clerk, limpar envs.

## Riscos
- **Senha** (maior atrito): todo usuário web reseta no 1º acesso. Comunicar por
  e-mail; magic link suaviza.
- **Sessões Clerk** invalidam no cutover → re-login.
- **Rollback**: enquanto `AUTH_MODE=federated`, JWT Clerk ainda funciona —
  dá pra reverter o web sem quebrar a API. Não remover Clerk antes de validar.
- **SMTP**: sem provedor próprio no Supabase, o disparo de reset em massa trava.

## Pontos de contato
- Dúvida sobre contrato/erros da API → backend.
- Backend roda script de migração + flip do `AUTH_MODE` na janela combinada.
