-- ============================================================
-- PROFESSIONAL BLOCKS — Bloqueios pontuais (folga, almoço, intervalo)
-- ============================================================
CREATE TABLE "professional_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "professional_blocks_tenantId_date_idx" ON "professional_blocks"("tenantId", "date");
CREATE INDEX "professional_blocks_professionalId_date_idx" ON "professional_blocks"("professionalId", "date");

ALTER TABLE "professional_blocks" ADD CONSTRAINT "professional_blocks_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "professional_blocks" ADD CONSTRAINT "professional_blocks_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
