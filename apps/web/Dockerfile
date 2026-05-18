# ============================================================
# STYLOGESTOR — Dockerfile do Dashboard (Next.js)
#
# IMPORTANTE:
# - O package se chama "web" no workspace (NÃO "@stylogestor/web").
# - Web importa @stylogestor/database em rotas /api → precisa copiar o
#   pacote E rodar `prisma generate` antes do build.
# - Requer `output: 'standalone'` em apps/web/next.config.ts.
# ============================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm@10
WORKDIR /app

# ─── Dependências ────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json* ./packages/shared/
RUN pnpm install --frozen-lockfile --filter web...

# ─── Build ───────────────────────────────────────────────────
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY apps/web ./apps/web
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
# Prisma Client precisa estar gerado pra Next conseguir tipar as rotas /api
RUN pnpm --filter @stylogestor/database run generate
RUN pnpm --filter web build

# ─── Produção (standalone) ───────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Standalone empacota server.js + node_modules minimal em apps/web/.next/standalone
# Em monorepo (outputFileTracingRoot=raiz), a estrutura final tem apps/web/server.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
