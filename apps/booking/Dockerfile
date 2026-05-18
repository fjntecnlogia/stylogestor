# ============================================================
# STYLOGESTOR — Dockerfile do Booking (Next.js, agendamento público)
# Package name: "booking" (não "@stylogestor/booking").
# Não depende de @stylogestor/database (consome via API).
# ============================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@10
WORKDIR /app

# ─── Dependências ────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./
COPY apps/booking/package.json ./apps/booking/
RUN pnpm install --frozen-lockfile --filter booking...

# ─── Build ───────────────────────────────────────────────────
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY apps/booking ./apps/booking
RUN pnpm --filter booking build

# ─── Produção (standalone) ───────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3003
ENV HOSTNAME=0.0.0.0
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/booking/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/booking/.next/static ./apps/booking/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/booking/public ./apps/booking/public

USER nextjs
EXPOSE 3003

CMD ["node", "apps/booking/server.js"]
