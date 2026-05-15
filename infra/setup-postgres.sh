#!/bin/bash
# ============================================================
# STYLOGESTOR — Setup PostgreSQL no VPS
# Execute como root: bash /opt/stylogestor/infra/setup-postgres.sh
# ============================================================

DB_NAME="stylogestor"
DB_USER="stylogestor"
DB_PASS="Stylo@2026#Secure"   # Troque por uma senha forte!

echo "🐘 Configurando PostgreSQL para STYLOGESTOR..."

# Criar usuário e banco
sudo -u postgres psql <<EOF
-- Criar usuário
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  END IF;
END \$\$;

-- Criar banco
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

-- Permissões
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\c ${DB_NAME}
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- Para gen_random_uuid()
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

echo "✅ PostgreSQL configurado!"
echo ""
echo "DATABASE_URL para o .env:"
echo "postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
echo ""
echo "Próximo passo: rodar as migrações Prisma"
echo "cd /opt/stylogestor/packages/database && pnpm exec prisma migrate deploy"
