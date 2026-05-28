-- Fase 0 da unificação de identidade (Clerk web + Supabase mobile).
-- Email é a chave de unificação; ambos os IDs viram nullable.

-- 1. clerkId passa a ser nullable (users criados via Supabase não têm clerkId)
ALTER TABLE "users" ALTER COLUMN "clerkId" DROP NOT NULL;

-- 2. Adiciona supabaseId (nullable, unique)
ALTER TABLE "users" ADD COLUMN "supabaseId" TEXT;

-- 3. Índice único parcial — permite múltiplos NULL mas unicidade quando preenchido
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");
