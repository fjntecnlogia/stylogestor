-- ============================================================
-- SYSTEM LOGS — Log centralizado da aplicação
-- ============================================================
-- Eventos importantes (criação de tenant, resgate de código, erros
-- em crons, etc) gravados aqui pra visualização no painel admin.
-- Substitui parcialmente o console.log + grep manual em logs PM2.

CREATE TABLE "system_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "level" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "system_logs_level_createdAt_idx" ON "system_logs"("level", "createdAt");
CREATE INDEX "system_logs_source_createdAt_idx" ON "system_logs"("source", "createdAt");
CREATE INDEX "system_logs_tenantId_createdAt_idx" ON "system_logs"("tenantId", "createdAt");
