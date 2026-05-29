-- Fase 3 da unificação de identidade — vínculo Professional <-> User (login).
-- Permite que o POST /professionals/invite crie o login Supabase do barbeiro e
-- o vincule ao Professional, e que o syncClaimsForUser re-resolva
-- professionalId/professionalName de forma robusta (sem depender de match por email).
--
-- Seguro/idempotente:
--   * ADD COLUMN nullable, sem default  -> não reescreve a tabela, não trava em linhas existentes
--   * UNIQUE index                      -> Postgres permite múltiplos NULL (profissionais sem login coexistem)
--   * FK ON DELETE SET NULL             -> apagar o login não apaga o profissional
--   * guards IF NOT EXISTS              -> re-execução segura (o deploy da VPS também usa db push)

-- 1. Coluna userId (nullable, sem default)
ALTER TABLE "professionals" ADD COLUMN IF NOT EXISTS "userId" UUID;

-- 2. Índice único (1 login = 1 professional; vários NULL permitidos)
CREATE UNIQUE INDEX IF NOT EXISTS "professionals_userId_key" ON "professionals"("userId");

-- 3. Foreign key para users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professionals_userId_fkey'
  ) THEN
    ALTER TABLE "professionals"
      ADD CONSTRAINT "professionals_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
