-- ============================================================
-- SYSTEM SETTINGS — Configurações globais do SaaS (key/value)
-- ============================================================
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- ============================================================
-- PROMO CODES — Códigos promocionais (extensão de trial)
-- ============================================================
CREATE TABLE "promo_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "description" TEXT,
    "trialDays" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- ============================================================
-- PROMO CODE REDEMPTIONS — Histórico de uso dos códigos
-- ============================================================
CREATE TABLE "promo_code_redemptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promoCodeId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trialDays" INTEGER NOT NULL,

    CONSTRAINT "promo_code_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "promo_code_redemptions_tenantId_idx" ON "promo_code_redemptions"("tenantId");
CREATE INDEX "promo_code_redemptions_promoCodeId_idx" ON "promo_code_redemptions"("promoCodeId");

ALTER TABLE "promo_code_redemptions" ADD CONSTRAINT "promo_code_redemptions_promoCodeId_fkey"
    FOREIGN KEY ("promoCodeId") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
