# ============================================================
# STYLOGESTOR — Dockerfile do Site (Next.js, institucional)
# Package name: "site" (não "@stylogestor/site").
# Não depende de @stylogestor/database.
# ============================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@10
WORKDIR /app

# ─── Dependências ────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./
COPY apps/site/package.json ./apps/site/
RUN pnpm install --frozen-lockfile --filter site...

# ─── Build ───────────────────────────────────────────────────
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY apps/site ./apps/site
RUN pnpm --filter site build

# ─── Produção (standalone) ───────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/site/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/site/.next/static ./apps/site/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/site/public ./apps/site/public

USER nextjs
EXPOSE 3002

CMD ["node", "apps/site/server.js"]
