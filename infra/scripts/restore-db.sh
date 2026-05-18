#!/bin/bash
#
# Restore do DB do STYLOGESTOR a partir de backup gerado por backup-db.sh.
#
# ⚠️ DESTRUTIVO — sobrescreve o DB atual. Faça backup antes.
#
# Uso:
#   sudo /opt/stylogestor/infra/scripts/restore-db.sh /var/backups/stylogestor/stylogestor-YYYYMMDD-HHMM.dump.gz
#
# Pra teste em DB temporário (SEM tocar no DB de prod):
#   sudo -u postgres createdb stylogestor_restore_test
#   gunzip -c <arquivo> | sudo -u postgres pg_restore -d stylogestor_restore_test -c
#   sudo -u postgres psql -d stylogestor_restore_test -c "SELECT COUNT(*) FROM tenants;"
#   sudo -u postgres dropdb stylogestor_restore_test

set -euo pipefail

BACKUP_FILE="${1:-}"
DB_NAME="stylogestor"

# pg_restore deve ter versão >= servidor (15+ pra DB Postgres 15)
PG_DUMP=""
PG_RESTORE=""
for ver in 17 16 15; do
  if [ -x "/usr/pgsql-${ver}/bin/pg_dump" ]; then
    PG_DUMP="/usr/pgsql-${ver}/bin/pg_dump"
    PG_RESTORE="/usr/pgsql-${ver}/bin/pg_restore"
    break
  fi
done
[ -z "$PG_DUMP" ] && PG_DUMP=$(which pg_dump)
[ -z "$PG_RESTORE" ] && PG_RESTORE=$(which pg_restore)

if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: $0 <arquivo.dump.gz>"
  echo ""
  echo "Backups disponíveis:"
  ls -lh /var/backups/stylogestor/*.dump.gz 2>/dev/null || echo "  (nenhum)"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERRO: arquivo $BACKUP_FILE não existe" >&2
  exit 1
fi

echo "⚠️  Vou RESTORE de $BACKUP_FILE para o DB '$DB_NAME'"
echo "⚠️  Isso SOBRESCREVE todos os dados atuais."
echo "Pressione ENTER pra continuar ou Ctrl+C pra abortar..."
read -r

# 1. Backup do estado atual (segurança extra)
SAFETY_BACKUP="/var/backups/stylogestor/before-restore-$(date +%Y%m%d-%H%M).dump.gz"
echo "[restore] backup de seguranca em $SAFETY_BACKUP..."
sudo -u postgres "$PG_DUMP" --format=custom --dbname="$DB_NAME" 2>/dev/null \
  | gzip > "$SAFETY_BACKUP"
echo "[restore] safety backup OK"

# 2. Restore
echo "[restore] aplicando $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | sudo -u postgres "$PG_RESTORE" --clean --if-exists --dbname="$DB_NAME" \
  || { echo "[restore] FALHOU. Safety backup em $SAFETY_BACKUP" >&2; exit 1; }

# 3. Sanity check
TENANT_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM tenants" 2>/dev/null || echo "ERRO")
echo "[restore] OK. Tenants no banco restaurado: $TENANT_COUNT"
echo "[restore] safety backup preservado em: $SAFETY_BACKUP (apague manualmente se tudo OK)"
