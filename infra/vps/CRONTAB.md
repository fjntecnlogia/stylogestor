# Crontab da VPS — Jobs agendados do STYLOGESTOR

Pra configurar os jobs cron no servidor, edite o crontab do `root`:

```bash
ssh root@82.25.65.201
crontab -e
```

## Jobs ativos

```cron
# STYLOGESTOR — avisar trial expirando (3d / 1d / hoje)
# Roda diariamente às 09:00 BRT — antes do horário comercial pra dar tempo
# do gestor reagir e renovar / resgatar código antes do trial vencer.
0 9 * * * curl -fsS -H "X-Cron-Secret: $CRON_SECRET" https://app.stylogestor.com.br/api/cron/trial-warnings >> /var/log/stylogestor-cron.log 2>&1

# STYLOGESTOR — lembrete de agendamento 24h antes (WhatsApp)
# Roda DE HORA EM HORA pra cobrir todos os agendamentos.
# Idempotente via Appointment.reminderSent — mesmo cliente nunca recebe
# 2 mensagens. Pula appointments sem telefone do cliente.
0 * * * * curl -fsS -H "X-Cron-Secret: $CRON_SECRET" https://app.stylogestor.com.br/api/cron/appointment-reminders >> /var/log/stylogestor-cron.log 2>&1
```

## Variável de ambiente

O `CRON_SECRET` precisa estar tanto no `apps/web/.env.production.local` quanto
no shell do root (ou hardcoded no crontab no lugar de `$CRON_SECRET`).

**Opção A (hardcoded no crontab — mais simples):**
```cron
0 9 * * * curl -fsS -H "X-Cron-Secret: SEU_SECRET_AQUI" https://app.stylogestor.com.br/api/cron/trial-warnings >> /var/log/stylogestor-cron.log 2>&1
```

**Opção B (env var via /etc/environment ou similar):**
```bash
echo 'CRON_SECRET=algumstringaleatoria123' >> /etc/environment
```
Depois usar `$CRON_SECRET` no crontab.

## Setar CRON_SECRET no app

Adicione em `/opt/stylogestor/apps/web/.env.production.local`:
```
CRON_SECRET=algumstringaleatoria123
```

E reinicie a app:
```bash
pm2 restart stylo-web --update-env
```

Sem `CRON_SECRET` definido no app, o endpoint **aceita qualquer chamada**
(modo dev). Em prod, defina pra evitar abuso.

## Testar manualmente

```bash
curl -H "X-Cron-Secret: SEU_SECRET" https://app.stylogestor.com.br/api/cron/trial-warnings
```

Resposta esperada:
```json
{
  "ok": true,
  "timestamp": "2026-05-19T12:00:00.000Z",
  "results": [
    { "daysLeft": 3, "count": 2, "sent": 2, "failed": 0 },
    { "daysLeft": 1, "count": 0, "sent": 0, "failed": 0 },
    { "daysLeft": 0, "count": 1, "sent": 1, "failed": 0 }
  ]
}
```

## Log

Verificar últimas execuções:
```bash
tail -100 /var/log/stylogestor-cron.log
```

Ou via PM2 (logs do app):
```bash
pm2 logs stylo-web --lines 100 --nostream | grep TRIAL_WARN
```
