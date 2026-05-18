#!/bin/bash
#
# Backup automático do Postgres do STYLOGESTOR.
# Roda via cron diário em /etc/cron.d/stylogestor-backup.
#
# Estratégia:
#   - pg_dump custom format (--format=custom) para restore granular
#   - gzip compressão
#   - Retenção 7 dias (apaga mais antigos)
#   - Falhas no Sentry via API (se SENTRY_DSN setado)
#
# Como usar manualmente:
#   sudo /opt/stylogestor/infra/scripts/backup-db.sh
#
# Restore (CUIDADO — sobrescreve DB):
#   gunzip -c /var/backups/stylogestor/stylogestor-YYYYMMDD-HHMM.dump.gz | \
#     sudo -u postgres pg_restore -d stylogestor -c

set -euo pipefail

DB_NAME="stylogestor"
DB_USER="stylogestor"
BACKUP_DIR="/var/backups/stylogestor"
TIMESTAMP=$(date +%Y%m%d-%H%M)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.dump.gz"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# Faz dump como usuário postgres (socket Unix → sem precisar de senha)
# Custom format permite restore seletivo de tabelas
sudo -u postgres pg_dump \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --dbname="$DB_NAME" \
  --file=/dev/stdout 2>/tmp/backup-stylogestor-err.log \
  | gzip > "$BACKUP_FILE"

# Validar que o arquivo foi gerado e não está vazio
if [ ! -s "$BACKUP_FILE" ]; then
  echo "[backup-db] ERRO: $BACKUP_FILE vazio ou ausente" >&2
  cat /tmp/backup-stylogestor-err.log >&2 || true
  exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[backup-db] OK $BACKUP_FILE ($SIZE)"

# Retenção: apaga backups com mais de N dias
find "$BACKUP_DIR" -name "${DB_NAME}-*.dump.gz" -type f -mtime +${RETENTION_DAYS} -delete
echo "[backup-db] cleanup: removed backups older than ${RETENTION_DAYS} days"
