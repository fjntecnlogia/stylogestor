#!/bin/bash
# ============================================================
# STYLOGESTOR — Setup inicial do VPS Hostinger
# Execute UMA VEZ como root: bash setup-vps.sh
# Testado em Ubuntu 22.04 LTS
# ============================================================
set -e

DOMAIN="stylogestor.com.br"
EMAIL="fjntecnologia2022@gmail.com"

echo "=================================================="
echo " STYLOGESTOR — Setup VPS Hostinger"
echo " Domínio: $DOMAIN"
echo "=================================================="

# 1. Atualiza sistema
echo "📦 Atualizando sistema..."
apt-get update -y && apt-get upgrade -y

# 2. Instala dependências
echo "📦 Instalando dependências..."
apt-get install -y curl git wget unzip ufw fail2ban

# 3. Instala Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com | bash
systemctl enable docker
systemctl start docker

# 4. Instala Docker Compose
echo "🐳 Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 5. Instala Node.js 20 LTS
echo "📦 Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm pm2

# 6. Configura Firewall
echo "🔒 Configurando Firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 7. Configura Fail2ban
echo "🔒 Configurando Fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# 8. Instala Certbot (SSL)
echo "🔒 Instalando Certbot..."
apt-get install -y certbot

# 9. Cria diretórios do projeto
echo "📁 Criando estrutura de diretórios..."
mkdir -p /opt/stylogestor
mkdir -p /opt/stylogestor-env
mkdir -p /var/www/certbot

# 10. Obtém certificado SSL (wildcard para *.stylogestor.com.br)
echo "🔒 Obtendo certificado SSL..."
echo ""
echo "⚠️  IMPORTANTE: Você precisará adicionar um registro TXT no DNS da Hostinger"
echo "   quando solicitado pelo Certbot abaixo."
echo ""
certbot certonly \
  --manual \
  --preferred-challenges dns \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  -d "app.$DOMAIN" \
  -d "api.$DOMAIN" \
  -d "*.$DOMAIN"

# 11. Renova SSL automaticamente
echo "🔄 Configurando renovação automática de SSL..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker exec stylogestor_nginx nginx -s reload") | crontab -

# 12. Cria arquivo de variáveis de produção
echo "📝 Criando template de variáveis de ambiente..."
cat > /opt/stylogestor-env/.env.prod << 'EOF'
# ============================================================
# STYLOGESTOR — Variáveis de Produção
# Preencha TODOS os valores antes do deploy
# ============================================================

NODE_ENV=production
DOMAIN=stylogestor.com.br

# Banco de dados
POSTGRES_DB=stylogestor
POSTGRES_USER=stylo
POSTGRES_PASSWORD=TROQUE_POR_SENHA_FORTE_AQUI
DATABASE_URL=postgresql://stylo:TROQUE_POR_SENHA_FORTE_AQUI@postgres:5432/stylogestor

# Redis
REDIS_PASSWORD=TROQUE_POR_SENHA_REDIS_AQUI

# App URLs
NEXT_PUBLIC_APP_URL=https://app.stylogestor.com.br
NEXT_PUBLIC_API_URL=https://api.stylogestor.com.br
BASE_DOMAIN=stylogestor.com.br

# Clerk (crie em clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Pagar.me (crie em pagar.me)
PAGARME_API_KEY=ak_live_...
PAGARME_WEBHOOK_SECRET=...

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://evolution:8080
EVOLUTION_API_KEY=stylo_evolution_key_2026
EVOLUTION_INSTANCE_NAME=stylogestor

# Resend (email)
RESEND_API_KEY=re_...
EMAIL_FROM=no-reply@stylogestor.com.br

# Cloudflare R2 (storage)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=stylogestor
R2_PUBLIC_URL=https://cdn.stylogestor.com.br

# Internal API key
INTERNAL_API_KEY=GERE_UMA_CHAVE_ALEATORIA_FORTE_AQUI
EOF

chmod 600 /opt/stylogestor-env/.env.prod

echo ""
echo "=================================================="
echo " ✅ Setup do VPS concluído!"
echo "=================================================="
echo ""
echo " Próximos passos:"
echo " 1. Preencha /opt/stylogestor-env/.env.prod"
echo " 2. Configure DNS da Hostinger:"
echo "    A    @           → IP_DO_VPS"
echo "    A    www         → IP_DO_VPS"
echo "    A    app         → IP_DO_VPS"
echo "    A    api         → IP_DO_VPS"
echo "    A    *           → IP_DO_VPS  (wildcard)"
echo " 3. Execute: bash /opt/stylogestor/infra/vps/deploy.sh"
echo ""
