@AGENTS.md

# 🖥️ Session: FRONTEND — Dashboard do Gestor (`apps/web`)

> **Quem usa:** Dev Frontend responsável pelo painel principal usado pelo dono da barbearia/salão.

## Escopo desta session
- App Next.js 16 do **gestor logado**: agenda, clientes, financeiro, profissionais, serviços, estoque, configurações.
- Multi-tenant por subdomínio: `{slug}.stylogestor.com.br`.
- Auth via Clerk; toda página privada precisa estar protegida.

## Stack
- **Next.js** 16.2.6 (App Router) — leia `node_modules/next/dist/docs/` antes de mexer em APIs novas
- **React** 19.2.4
- **TypeScript** 5
- **Tailwind v4** (config via PostCSS, sem `tailwind.config.js`)
- **shadcn/ui + Radix** (`@radix-ui/react-*` instalados)
- **Clerk** (`@clerk/nextjs` v7.3.3) + localização PT-BR (`@clerk/localizations`)
- **FullCalendar** v6 (visualização da agenda)
- **Stripe** v22 (em uso para checkout secundário; primário é Pagar.me no backend)
- **date-fns** v4
- **lucide-react** (ícones)

## Comandos
```bash
pnpm --filter web dev      # localhost:3000
pnpm --filter web build
pnpm --filter web lint
```

## NÃO toque
- ❌ `packages/api/` — pertence ao time Backend
- ❌ `packages/database/` — pertence ao time DB
- ❌ `apps/mobile-*` — pertence ao time Mobile
- ❌ Adicionar `tailwind.config.js` (Tailwind v4 não usa)
- ❌ Downgrade de React/Next sem alinhamento

## Convenções
- **Componentes RSC por padrão**. `'use client'` só quando precisar de hook/event/browser API.
- **Imports absolutos**: `@/components/...`, `@/lib/...`.
- **shadcn pattern**: componentes em `src/components/ui/`. Use `cn()` de `@/lib/utils`.
- **Auth**: `import { auth } from '@clerk/nextjs/server'` em RSC; `useUser()` em client.
- **Tipos do banco**: `import type { ... } from '@stylogestor/database'`.
- **Não fazer fetch direto ao Postgres** no front — sempre via API NestJS (`NEXT_PUBLIC_API_URL`).

## Onde está o quê
```
src/
├── app/                  ← rotas (App Router)
│   ├── (auth)/           ← login, cadastro
│   ├── (dashboard)/      ← área logada
│   └── api/              ← route handlers (webhooks, proxy)
├── components/
│   └── ui/               ← shadcn
├── lib/                  ← utils, api client
└── middleware.ts         ← Clerk + tenant resolution
```

## Antes de PR
1. `pnpm --filter web lint` passa
2. `pnpm --filter web build` passa
3. Testou no Chrome + mobile (responsivo)
4. Subagent: invoque `frontend-reviewer`

## Variáveis necessárias (`.env.local`)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
BASE_DOMAIN=stylogestor.com.br
```

## Referências
- Roadmap geral: `@../../G:/Meu Drive/Controle de Clientes FJN/clientes/STYLOGESTOR/04_DESENVOLVIMENTO/ROADMAP_GERAL.md` (no Drive)
- Documentação de uso: `@../../DOCUMENTACAO.md`
- Design system: `@../../design/CLAUDE.md`
