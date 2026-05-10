#!/bin/bash
# ============================================================
# STYLOGESTOR — Script de Deploy no VPS Hostinger
# Execute no servidor: bash deploy.sh
# ============================================================
set -e

REPO="https://github.com/SEU_USUARIO/stylogestor.git"
APP_DIR="/opt/stylogestor"
BRANCH="main"

echo "🚀 Iniciando deploy do STYLOGESTOR..."

# 1. Atualiza o código
if [ -d "$APP_DIR" ]; then
  echo "📥 Atualizando repositório..."
  cd "$APP_DIR"
  git pull origin "$BRANCH"
else
  echo "📥 Clonando repositório..."
  git clone -b "$BRANCH" "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# 2. Copia .env de produção (deve existir no servidor)
if [ -f "/opt/stylogestor-env/.env.prod" ]; then
  cp /opt/stylogestor-env/.env.prod ./infra/vps/.env.prod
  echo "✅ Variáveis de ambiente copiadas"
else
  echo "⚠️  ATENÇÃO: /opt/stylogestor-env/.env.prod não encontrado!"
  echo "   Crie o arquivo com as variáveis de produção antes de continuar."
  exit 1
fi

# 3. Build das imagens Docker
echo "🔨 Buildando imagens..."
docker build -f Dockerfile.api -t stylogestor/api:latest .
docker build -f apps/web/Dockerfile -t stylogestor/web:latest .
docker build -f apps/site/Dockerfile -t stylogestor/site:latest .
docker build -f apps/booking/Dockerfile -t stylogestor/booking:latest .

# 4. Sobe os containers
echo "🐳 Subindo containers..."
cd infra/vps
docker-compose -f docker-compose.prod.yml pull postgres redis evolution
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

# 5. Aguarda o banco ficar pronto
echo "⏳ Aguardando PostgreSQL..."
sleep 5

# 6. Roda migrations do Prisma
echo "🗄️  Rodando migrations..."
docker exec stylogestor_api npx prisma migrate deploy

# 7. Recarrega Nginx
docker exec stylogestor_nginx nginx -s reload

echo ""
echo "✅ Deploy concluído!"
echo "   Site:      https://stylogestor.com.br"
echo "   Dashboard: https://app.stylogestor.com.br"
echo "   API:       https://api.stylogestor.com.br/docs"
echo ""
