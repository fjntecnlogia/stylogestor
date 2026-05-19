-- ============================================================
-- CASH CLOSURES — Fechamento de caixa do dia (snapshot imutável)
-- ============================================================
CREATE TABLE "cash_closures" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "totalIn" DECIMAL(10, 2) NOT NULL,
    "totalOut" DECIMAL(10, 2) NOT NULL,
    "net" DECIMAL(10, 2) NOT NULL,
    "appointments" INTEGER NOT NULL,
    "cancelations" INTEGER NOT NULL,
    "byMethod" JSONB NOT NULL,
    "byProfessional" JSONB NOT NULL,
    "totalCommissions" DECIMAL(10, 2) NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedByClerkId" TEXT,
    "notes" TEXT,

    CONSTRAINT "cash_closures_pkey" PRIMARY KEY ("id")
);

-- Apenas 1 fechamento por dia por tenant
CREATE UNIQUE INDEX "cash_closures_tenantId_date_key" ON "cash_closures"("tenantId", "date");
CREATE INDEX "cash_closures_tenantId_date_idx" ON "cash_closures"("tenantId", "date");

ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
