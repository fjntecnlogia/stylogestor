-- ============================================================
-- SITE VISITS — Analytics do site público (apps/site)
-- ============================================================
CREATE TABLE "site_visits" (
    "id"     UUID NOT NULL DEFAULT gen_random_uuid(),
    "path"   TEXT NOT NULL,
    "ipHash" TEXT,
    "uaHash" TEXT,
    "ts"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_visits_ts_idx"       ON "site_visits"("ts");
CREATE INDEX "site_visits_path_ts_idx"  ON "site_visits"("path", "ts");
