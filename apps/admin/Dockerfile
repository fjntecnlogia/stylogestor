# ============================================================
# STYLOGESTOR — Dockerfile do Admin SaaS (Next.js)
#
# IMPORTANTE:
# - O package se chama "admin" no workspace (NÃO "@stylogestor/admin").
# - Admin importa @stylogestor/database → precisa copiar o pacote
#   E rodar `prisma generate` antes do build.
# - Requer `output: 'standalone'` em apps/admin/next.config.ts.
# ============================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm@10
WORKDIR /app

# ─── Dependências ────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/database/package.json ./packages/database/
RUN pnpm install --frozen-lockfile --filter admin...

# ─── Build ───────────────────────────────────────────────────
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY apps/admin ./apps/admin
COPY packages/database ./packages/database
# Prisma Client precisa estar gerado pra Next conseguir tipar as routes /api
RUN pnpm --filter @stylogestor/database run generate
RUN pnpm --filter admin build

# ─── Produção (standalone) ───────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3004
ENV HOSTNAME=0.0.0.0
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Standalone empacota server.js + node_modules minimal em apps/admin/.next/standalone
# Em monorepo (outputFileTracingRoot=raiz), a estrutura final tem apps/admin/server.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public

USER nextjs
EXPOSE 3004

CMD ["node", "apps/admin/server.js"]
