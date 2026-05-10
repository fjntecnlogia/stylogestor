-- STYLOGESTOR — Init SQL
-- Habilita extensões necessárias para o schema Prisma

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- busca por similaridade (clientes)

-- Row-Level Security será ativada via Prisma migrations
-- As políticas são criadas após as tabelas existirem
