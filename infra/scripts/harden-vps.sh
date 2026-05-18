#!/bin/bash
#
# Hardening básico do VPS — Fase 1 produção do STYLOGESTOR.
#
# Aplica:
#   - chmod 600 nos .env (evita leak por outros usuários)
#   - firewalld (libera só 80/443/22)
#   - fail2ban (bloqueia brute-force SSH)
#   - PM2 logrotate
#
# ⚠️ NÃO desativa SSH password aqui — fazer manualmente depois de garantir
#    que SSH key funciona. Veja seção "passos manuais" no fim.
#
# Uso (precisa root):
#   sudo /opt/stylogestor/infra/scripts/harden-vps.sh

set -euo pipefail

echo "========================================"
echo "STYLOGESTOR — Hardening de VPS"
echo "========================================"
echo ""

# ── 1. Permissões dos .env ─────────────────────────
echo "[1/4] chmod 600 nos .env..."
ENV_FILES=(
  /opt/stylogestor/.env*
  /opt/stylogestor/apps/web/.env*
  /opt/stylogestor/apps/admin/.env*
  /opt/stylogestor/apps/booking/.env*
  /opt/stylogestor/apps/site/.env*
  /opt/stylogestor/packages/api/.env
)
for pattern in "${ENV_FILES[@]}"; do
  for f in $pattern; do
    if [ -f "$f" ]; then
      chmod 600 "$f"
      echo "  ✓ $f"
    fi
  done
done
echo ""

# ── 2. Firewall (firewalld no CentOS/RHEL) ─────────
echo "[2/4] firewalld..."
if ! command -v firewall-cmd &>/dev/null; then
  echo "  instalando firewalld..."
  yum install -y firewalld 2>/dev/null || dnf install -y firewalld
fi

systemctl enable --now firewalld

# Libera só portas essenciais
firewall-cmd --permanent --add-service=http 2>/dev/null || true
firewall-cmd --permanent --add-service=https 2>/dev/null || true
firewall-cmd --permanent --add-service=ssh 2>/dev/null || true
# CyberPanel admin (8090) — manter por enquanto
firewall-cmd --permanent --add-port=8090/tcp 2>/dev/null || true
# Bloqueia explicitamente 3000-3001 (API e Next direto — só Cloudflare->LiteSpeed deve acessar)
# (firewalld não bloqueia por padrão, mas deixamos explicitas as portas permitidas)

firewall-cmd --reload
echo "  ✓ firewalld ativo. Portas: 80, 443, 22, 8090"
echo ""

# ── 3. Fail2ban ───────────────────────────────────
echo "[3/4] fail2ban..."
if ! command -v fail2ban-server &>/dev/null; then
  echo "  instalando fail2ban..."
  yum install -y fail2ban 2>/dev/null || dnf install -y fail2ban
fi

# Config básica pro SSH
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
backend = systemd
EOF

systemctl enable --now fail2ban
systemctl restart fail2ban
echo "  ✓ fail2ban ativo. SSH: 5 tentativas/10min → ban 1h"
echo ""

# ── 4. PM2 logrotate ───────────────────────────────
echo "[4/4] pm2-logrotate..."
pm2 install pm2-logrotate >/dev/null 2>&1
pm2 set pm2-logrotate:max_size 10M >/dev/null
pm2 set pm2-logrotate:retain 7 >/dev/null
pm2 set pm2-logrotate:compress true >/dev/null
echo "  ✓ pm2-logrotate ativo. 10M por arquivo, retenção 7 arquivos, gzip"
echo ""

echo "========================================"
echo "✅ Hardening aplicado!"
echo "========================================"
echo ""
echo "PASSOS MANUAIS RESTANTES (faça com SSH key já testada):"
echo ""
echo "  1) Desativar SSH password authentication:"
echo "     sed -i 's/^#\\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config"
echo "     systemctl restart sshd"
echo ""
echo "  2) Configurar PM2 startup (sobrevive reboot):"
echo "     pm2 startup     # mostra comando — copie e cole"
echo "     pm2 save"
echo ""
echo "  3) Configurar backup automático do DB:"
echo "     sudo /opt/stylogestor/infra/scripts/setup-cron-backup.sh"
echo ""
echo "  4) Validar restore manual:"
echo "     # 1. Faz backup agora"
echo "     sudo /opt/stylogestor/infra/scripts/backup-db.sh"
echo "     # 2. Cria DB temporário e restaura"
echo "     sudo -u postgres createdb stylogestor_restore_test"
echo "     LATEST=\$(ls -t /var/backups/stylogestor/*.dump.gz | head -1)"
echo "     gunzip -c \"\$LATEST\" | sudo -u postgres pg_restore -d stylogestor_restore_test"
echo "     # 3. Verifica que tem dados"
echo "     sudo -u postgres psql -d stylogestor_restore_test -c \"SELECT COUNT(*) FROM tenants;\""
echo "     # 4. Limpa"
echo "     sudo -u postgres dropdb stylogestor_restore_test"
