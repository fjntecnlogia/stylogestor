#!/bin/bash
# ============================================================
# STYLOGESTOR — Setup VPS Hostinger
# IP: 82.25.65.201 | Domínio: stylogestor.com.br
# DNS: Cloudflare (proxy ON) — sem Certbot necessário!
# Execute como root: bash setup-vps.sh
# Ubuntu 22.04 LTS
# ============================================================
set -e

DOMAIN="stylogestor.com.br"
EMAIL="fjntecnologia2022@gmail.com"
VPS_IP="82.25.65.201"
REPO="https://github.com/fjntecnlogia/stylogestor.git"

echo "=================================================="
echo " STYLOGESTOR — Setup VPS Hostinger"
echo " IP: $VPS_IP | Domínio: $DOMAIN"
echo " DNS: Cloudflare (SSL gerenciado pelo Cloudflare)"
echo "=================================================="

# 1. Atualiza sistema
echo ""
echo "📦 [1/9] Atualizando sistema..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git wget unzip ufw fail2ban

# 2. Docker
echo ""
echo "🐳 [2/9] Instalando Docker..."
curl -fsSL https://get.docker.com | bash
systemctl enable docker
systemctl start docker

# Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
echo "   Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
echo "   Docker Compose $(docker-compose --version | cut -d' ' -f4 | tr -d ',')"

# 3. Node.js 20
echo ""
echo "📦 [3/9] Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm pm2
echo "   Node.js $(node --version)"

# 4. Firewall
echo ""
echo "🔒 [4/9] Configurando Firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh       # porta 22
ufw allow 80/tcp    # HTTP  (Cloudflare precisa)
ufw allow 443/tcp   # HTTPS (Cloudflare precisa)
ufw --force enable
echo "   UFW ativo — portas 22, 80, 443 liberadas"

# 5. Fail2ban
echo ""
echo "🔒 [5/9] Configurando Fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban
echo "   Fail2ban ativo"

# 6. Estrutura de diretórios
echo ""
echo "📁 [6/9] Criando estrutura de diretórios..."
mkdir -p /opt/stylogestor
mkdir -p /opt/stylogestor-env

# 7. Nginx configurado para Cloudflare
# Como o Cloudflare é o proxy, não precisa de Certbot.
# O SSL termina no Cloudflare. Entre Cloudflare e VPS usamos HTTP.
# (ou SSL Origin Certificate do Cloudflare — opcional)
echo ""
echo "🌐 [7/9] Configurando Nginx para Cloudflare..."
cat > /opt/stylogestor/infra/vps/nginx/conf.d/cloudflare.conf << 'NGINX_EOF'
# IPs do Cloudflare (atualizado em 2026)
# Permite apenas tráfego vindo do Cloudflare
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;
real_ip_header CF-Connecting-IP;
NGINX_EOF
echo "   Nginx configurado para Cloudflare proxy"

# 8. Clonar repositório
echo ""
echo "📥 [8/9] Clonando repositório STYLOGESTOR..."
if [ -d "/opt/stylogestor/.git" ]; then
  cd /opt/stylogestor && git pull origin master
  echo "   Repositório atualizado"
else
  git clone "$REPO" /opt/stylogestor
  echo "   Repositório clonado"
fi

# 9. Criar arquivo .env.prod template
echo ""
echo "📝 [9/9] Criando template de variáveis de ambiente..."
cp /opt/stylogestor/infra/vps/.env.prod.example /opt/stylogestor-env/.env.prod
chmod 600 /opt/stylogestor-env/.env.prod

echo ""
echo "=================================================="
echo " ✅ Setup concluído!"
echo "=================================================="
echo ""
echo " PRÓXIMO PASSO OBRIGATÓRIO:"
echo " Preencha o arquivo de variáveis de ambiente:"
echo ""
echo "   nano /opt/stylogestor-env/.env.prod"
echo ""
echo " Você precisa preencher:"
echo "   1. POSTGRES_PASSWORD (crie uma senha forte)"
echo "   2. REDIS_PASSWORD (crie uma senha forte)"
echo "   3. CLERK_SECRET_KEY (em clerk.com)"
echo "   4. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (em clerk.com)"
echo "   5. CLERK_WEBHOOK_SECRET (em clerk.com)"
echo "   6. RESEND_API_KEY (em resend.com)"
echo "   7. PAGARME_API_KEY (em pagar.me — opcional)"
echo ""
echo " Depois execute:"
echo "   bash /opt/stylogestor/infra/vps/deploy.sh"
echo ""
echo " DNS necessário no Cloudflare:"
echo "   A    @       → $VPS_IP  (proxy ON)"
echo "   A    www     → $VPS_IP  (proxy ON)"
echo "   A    app     → $VPS_IP  (proxy ON)"
echo "   A    api     → $VPS_IP  (proxy ON)"
echo "   A    *       → $VPS_IP  (proxy ON)"
echo ""
