#!/bin/bash
#
# Configura cron pra rodar backup-db.sh diariamente às 03:00.
# Idempotente: pode rodar quantas vezes quiser.
#
# Uso:
#   sudo /opt/stylogestor/infra/scripts/setup-cron-backup.sh

set -euo pipefail

CRON_FILE="/etc/cron.d/stylogestor-backup"
SCRIPT_PATH="/opt/stylogestor/infra/scripts/backup-db.sh"
LOG_FILE="/var/log/stylogestor-backup.log"

if [ ! -x "$SCRIPT_PATH" ]; then
  echo "Tornando $SCRIPT_PATH executável..."
  chmod +x "$SCRIPT_PATH"
fi

cat > "$CRON_FILE" <<EOF
# STYLOGESTOR — Backup diário do Postgres
# Configurado em $(date -Iseconds)
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Roda backup todos os dias às 03:00 (horário do servidor)
0 3 * * * root $SCRIPT_PATH >> $LOG_FILE 2>&1
EOF

chmod 644 "$CRON_FILE"
touch "$LOG_FILE"
chmod 640 "$LOG_FILE"

echo "✅ Cron configurado em $CRON_FILE"
echo "Backup roda diariamente às 03:00. Log em $LOG_FILE"
echo ""
echo "Próximos backups (preview):"
# Mostra próximos 3 timestamps de execução
for d in 1 2 3; do
  echo "  $(date -d "tomorrow + $((d-1)) days" '+%Y-%m-%d') 03:00:00"
done
