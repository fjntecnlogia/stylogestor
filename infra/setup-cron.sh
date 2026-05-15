#!/bin/bash
# ============================================================
# STYLOGESTOR — Setup de Cron Jobs
# Execute no VPS: bash /opt/stylogestor/infra/setup-cron.sh
# ============================================================

APP_URL="https://app.stylogestor.com.br"
INTERNAL_KEY="stylo-internal-key-2026"

echo "⏰ Configurando cron jobs do STYLOGESTOR..."

# Adicionar cron jobs
(crontab -l 2>/dev/null; echo "
# STYLOGESTOR — Lembretes de agendamento (todo dia às 18h)
0 18 * * * curl -s -X POST '${APP_URL}/api/automations/reminders' -H 'x-internal-key: ${INTERNAL_KEY}' >> /var/log/stylogestor-reminders.log 2>&1

# STYLOGESTOR — Deploy automático (todo dia às 3h — opcional)
# 0 3 * * * bash /opt/stylogestor/infra/deploy.sh >> /var/log/stylogestor-deploy.log 2>&1
") | crontab -

echo "✅ Cron jobs configurados!"
crontab -l | grep STYLOGESTOR
