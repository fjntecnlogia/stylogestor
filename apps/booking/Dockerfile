FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/booking/package.json ./apps/booking/
RUN pnpm install --frozen-lockfile --filter @stylogestor/booking...

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY apps/booking ./apps/booking
RUN pnpm --filter @stylogestor/booking build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/booking/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/booking/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/booking/.next/static ./.next/static
USER nextjs
EXPOSE 3003
ENV PORT=3003
CMD ["node", "server.js"]
