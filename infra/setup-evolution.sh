#!/bin/bash
# ============================================================
# STYLOGESTOR — Setup Evolution API (WhatsApp)
# Execute no VPS: bash /opt/stylogestor/infra/setup-evolution.sh
# ============================================================

EVOLUTION_KEY="stylo-evolution-$(openssl rand -hex 16)"
EVOLUTION_PORT=8080

echo "💬 Instalando Evolution API..."

# Docker (se não tiver)
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker $USER
fi

# Parar container anterior se existir
docker stop evolution-api 2>/dev/null || true
docker rm evolution-api 2>/dev/null || true

# Subir Evolution API
docker run -d \
  --name evolution-api \
  --restart unless-stopped \
  -p ${EVOLUTION_PORT}:8080 \
  -e AUTHENTICATION_API_KEY="${EVOLUTION_KEY}" \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  -e WEBHOOK_GLOBAL_ENABLED=false \
  -e QRCODE_LIMIT=30 \
  -e LOG_LEVEL=ERROR \
  -v evolution_store:/evolution/store \
  -v evolution_instances:/evolution/instances \
  atendai/evolution-api:latest

echo ""
echo "✅ Evolution API rodando na porta ${EVOLUTION_PORT}"
echo ""
echo "🔑 API Key gerada (adicionar no .env):"
echo "EVOLUTION_API_URL=http://localhost:${EVOLUTION_PORT}"
echo "EVOLUTION_API_KEY=${EVOLUTION_KEY}"
echo "EVOLUTION_INSTANCE=stylogestor"
echo ""
echo "Para criar a instância WhatsApp e obter o QR code:"
echo "curl -s http://localhost:${EVOLUTION_PORT}/instance/create \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'apikey: ${EVOLUTION_KEY}' \\"
echo "  -d '{\"instanceName\":\"stylogestor\",\"qrcode\":true}'"
echo ""
echo "Depois acesse: https://app.stylogestor.com.br/configuracoes"
echo "e vá em Integrações → WhatsApp → Conectar"
