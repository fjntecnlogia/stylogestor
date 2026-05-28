# Unificação de Identidade — Clerk (web) + Supabase (mobile)

## Contexto

Estado em 28/05/2026:
- **Web** (apps/web, admin, booking, site) → **Clerk**
- **Mobile** (mobile-gestor, mobile-cliente) → **Supabase Auth** (migrado de Clerk)
- **API NestJS** → era só Clerk, agora **federada** (Clerk + Supabase)

Problema original: usuário criado no mobile (Supabase) não existia no web (Clerk)
e vice-versa. Bases de auth separadas → mesma pessoa com 2 contas.

## Decisão estratégica

**Convergir tudo para Supabase Auth + API NestJS**, em fases, com Clerk e
Supabase coexistindo durante a transição. **Email é a chave de unificação.**

Motivos:
- Mobile já está em Supabase (migração recente, não reverter)
- Reduzir dependência/custo do Clerk (cobra por MAU)
- Dono usa web + mobile-gestor → precisa ser a MESMA identidade
- Backend convergindo pra NestJS (Next routes são transitórias)

## Chave de unificação: EMAIL

A tabela `User` é a fonte de verdade da identidade:
```
User {
  id          uuid (PK)
  clerkId     string? unique   // web (null se só Supabase)
  supabaseId  string? unique   // mobile (null se só Clerk)
  email       string  unique   // ← CHAVE DE UNIFICAÇÃO
  ...
}
```

Mesma pessoa = mesmo email = mesmo User = mesmo tenant, independente do IdP.

## Roadmap

### ✅ Fase 0 — Fundação (CONCLUÍDA 28/05/2026)
- `User.clerkId` → nullable; `User.supabaseId` adicionado (nullable, unique)
- `MultiAuthGuard` substitui `ClerkAuthGuard`: aceita JWT Clerk OU Supabase
  - Decodifica `iss` do JWT pra rotear pro provider
  - Clerk: `verifyToken` → resolve User por clerkId, fallback email (linka)
  - Supabase: `getUser` → resolve User por supabaseId, fallback email (linka),
    cria User novo se não existir (mobile-first signup)
- `SupabaseAuthService` valida JWT via `supabase.auth.getUser` + cache Redis 60s
- **Resultado**: mobile (Supabase) já usa a API NestJS, web (Clerk) intacto

Env vars necessárias na API (servidor):
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   (ou SUPABASE_ANON_KEY)
```

### Fase 1 — Mobile consome a NestJS (PRÓXIMA)
- `mobile-gestor/lib/api.ts`: apontar `api.stylogestor.com.br` + JWT Supabase
- Migrar dados de `expo-secure-store` (storage local) → API/DB real
- mobile-cliente idem

### Fase 2 — Consolidar backend (Next routes → NestJS)
- Mover lógica de `apps/web/src/app/api/*` pra NestJS
- Web passa a chamar `api.stylogestor.com.br` (Clerk JWT, que a API aceita)
- Next routes viram thin proxies ou somem

### Fase 3 — Web migra Clerk → Supabase (reduz custo)
- Substituir Clerk no web por Supabase Auth (`@supabase/ssr`)
- **Migração de usuários** (login email+senha):
  - Senhas Clerk não exportam em texto. Estratégia no cutover:
    a) Forçar reset de senha (email "redefina sua senha") no primeiro login, OU
    b) Importar usuários no Supabase com flag de reset obrigatório
  - Linkar por email (User.email já é a chave)
- API NestJS: remover suporte Clerk do MultiAuthGuard (fica só Supabase)

### Fase 4 — Limpeza
- Remover `@clerk/*` de tudo (web + api)
- Webhook Clerk → remover ou migrar pra trigger Supabase
- Atualizar docs/CLAUDE.md

## Como funciona o login federado HOJE (pós-Fase 0)

```
Request com Authorization: Bearer <jwt>
   │
   ├─ MultiAuthGuard decodifica iss do JWT
   │
   ├─ iss contém "supabase" / "/auth/v1"?
   │     SIM → SupabaseAuthService.verify() → resolve User por supabaseId
   │            └─ não achou? fallback email → linka supabaseId
   │            └─ email novo? cria User (sem tenant ainda)
   │     NÃO → Clerk verifyToken() → resolve User por clerkId
   │            └─ não achou? fallback email → linka clerkId
   │            └─ email novo? 401 (espera webhook Clerk criar)
   │
   └─ request.user = { id, clerkId, supabaseId, email, name }
```

## Edge cases & decisões

- **Mesmo email em Clerk e Supabase**: resolvem pro MESMO User (correto — é a
  mesma pessoa). O User acumula clerkId + supabaseId.
- **User Supabase sem tenant**: criado no login, mas TenantGuard barra rotas
  que exigem tenant até o onboarding vincular a um tenant.
- **Cache de validação Supabase**: 60s no Redis (evita network call por request).
  Trade-off: token revogado demora até 60s pra parar de funcionar. Aceitável.
- **Webhook Clerk** (`auth/webhook`): continua criando User com clerkId no
  user.created. Não muda na Fase 0.
