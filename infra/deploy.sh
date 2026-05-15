#!/bin/bash
# ============================================================
# STYLOGESTOR — Script de Deploy Completo
# Execute no VPS: bash /opt/stylogestor/infra/deploy.sh
# ============================================================

set -e
APP_DIR="/opt/stylogestor"

echo "🚀 Iniciando deploy STYLOGESTOR..."

cd "$APP_DIR"

# 1. Puxar código mais recente
echo "📥 Git pull..."
git pull origin master

# 2. Instalar dependências
echo "📦 Instalando dependências..."
pnpm install --frozen-lockfile

# 3. Rodar migrações do banco
echo "🗄️ Rodando migrações Prisma..."
cd "$APP_DIR/packages/database"
pnpm exec prisma migrate deploy
pnpm exec prisma generate
cd "$APP_DIR"

# 4. Build dos apps
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

# 5. Restart PM2
echo "♻️ Reiniciando PM2..."
cd "$APP_DIR"
pm2 restart stylo-site stylo-web stylo-admin stylo-booking 2>/dev/null || pm2 restart all
pm2 save

echo "✅ Deploy completo!"
pm2 status
