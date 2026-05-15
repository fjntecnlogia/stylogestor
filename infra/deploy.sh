#!/bin/bash
# ============================================================
# STYLOGESTOR — Script de Deploy Completo
# Execute no VPS: bash /opt/stylogestor/infra/deploy.sh
# ============================================================

set -e
APP_DIR="/opt/stylogestor"
ENV_FILE="$APP_DIR/apps/web/.env.production.local"

echo "🚀 Iniciando deploy STYLOGESTOR..."

cd "$APP_DIR"

# 1. Puxar código mais recente
echo "📥 Git pull..."
git pull origin master

# 2. Carregar variáveis de ambiente
if [ -f "$ENV_FILE" ]; then
  echo "🔑 Carregando variáveis de ambiente..."
  export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
else
  echo "⚠️  Arquivo $ENV_FILE não encontrado!"
  exit 1
fi

# Garantir DATABASE_URL sem # literal (% encoding)
export DATABASE_URL="${DATABASE_URL//#/%23}"

echo "🗄️  DATABASE_URL: ${DATABASE_URL:0:40}..."

# 3. Instalar dependências
echo "📦 Instalando dependências..."
PNPM_YES=true pnpm install --no-frozen-lockfile

# 4. Rodar migrações do banco
echo "🗄️ Rodando migrações Prisma..."
cd "$APP_DIR/packages/database"
# Instalar sem NODE_ENV=production para incluir prisma
PNPM_YES=true NODE_ENV=development pnpm install --no-frozen-lockfile
# Usar o prisma do workspace (v6), não o npx (que pega v7)
DATABASE_URL="$DATABASE_URL" ./node_modules/.bin/prisma db push --accept-data-loss || \
DATABASE_URL="$DATABASE_URL" pnpm exec prisma db push --accept-data-loss
DATABASE_URL="$DATABASE_URL" pnpm exec prisma generate
cd "$APP_DIR"

# 5. Build dos apps
echo "🔨 Build: site..."
cd "$APP_DIR/apps/site"
pnpm build
cp -r .next/static .next/standalone/apps/site/.next/
cp -r public .next/standalone/apps/site/ 2>/dev/null || true

echo "🔨 Build: web..."
cd "$APP_DIR/apps/web"
pnpm build
cp -r .next/static .next/standalone/apps/web/.next/
cp -r public .next/standalone/apps/web/ 2>/dev/null || true

echo "🔨 Build: admin..."
cd "$APP_DIR/apps/admin"
pnpm build
cp -r .next/static .next/standalone/apps/admin/.next/
cp -r public .next/standalone/apps/admin/ 2>/dev/null || true

echo "🔨 Build: booking..."
cd "$APP_DIR/apps/booking"
pnpm build 2>/dev/null || echo "booking sem build configurado"
cp -r .next/static .next/standalone/apps/booking/.next/ 2>/dev/null || true

# 6. Restart PM2
echo "♻️ Reiniciando PM2..."
cd "$APP_DIR"
pm2 restart stylo-site stylo-web stylo-admin stylo-booking 2>/dev/null || pm2 restart all
pm2 save

echo "✅ Deploy completo!"
pm2 status
