# STYLOGESTOR — Runbook de Operação

> Guia rápido pra operação em produção. Em incidente, **vá direto na seção relevante** sem ler tudo.

## 📞 Contatos de emergência

| Recurso | Onde | Quem tem acesso |
|---|---|---|
| VPS Hostinger | `82.25.65.201` (root@srv842883) | FJN Tecnologia |
| GitHub repo | https://github.com/fjntecnlogia/stylogestor | FJN Tecnologia |
| Cloudflare | painel stylogestor.com.br | FJN Tecnologia |
| Sentry | https://sentry.io/organizations/fjntecnologia | FJN Tecnologia |
| UptimeRobot | painel uptimerobot.com | FJN Tecnologia |
| Stripe | dashboard.stripe.com | FJN Tecnologia |
| Clerk | dashboard.clerk.com | FJN Tecnologia |

---

## 🚨 Incidentes comuns

### A API não responde (`https://api.stylogestor.com.br` retorna 502/504)

```bash
# 1. SSH no VPS
ssh root@82.25.65.201

# 2. Estado do PM2
pm2 list                 # ver se stylo-api está online
pm2 logs stylo-api --lines 30 --nostream    # últimos erros

# 3. Restart se errored
pm2 restart stylo-api

# 4. Se restart não resolve, rebuild
cd /opt/stylogestor && git pull origin master
cd packages/api && npm run build   # script de build faz swap automático do tsconfig
pm2 restart stylo-api

# 5. Validar
curl https://api.stylogestor.com.br/api/v1/health
```

### Um app Next.js (web/admin/booking/site) não responde

```bash
# 1. SSH no VPS
ssh root@82.25.65.201

# 2. Restart específico
pm2 restart stylo-web      # ou stylo-admin / stylo-booking / stylo-site
pm2 logs stylo-web --lines 30 --nostream
```

### DB inacessível (todas APIs falhando)

```bash
# 1. Postgres está rodando?
sudo systemctl status postgresql

# 2. Conectar manualmente
sudo -u postgres psql -d stylogestor -c "SELECT current_user, current_database();"

# 3. Se Postgres caiu: restart
sudo systemctl restart postgresql

# 4. Validar que aplicações reconectam
pm2 restart all
```

### Cloudflare/SSL fora do ar

- Cloudflare cai? `https://www.cloudflarestatus.com/`
- LiteSpeed fora? `systemctl status lsws` ou painel CyberPanel
- Cert expirou? Let's Encrypt auto-renova; manualmente: painel CyberPanel → SSL → Issue SSL

---

## 🔄 Deploy

### Deploy da API NestJS (após push pro GitHub)

```bash
ssh root@82.25.65.201
cd /opt/stylogestor
git pull origin master
cd packages/api && npm run build      # script automatiza swap do tsconfig (Stripe v22)
pm2 restart stylo-api
sleep 3 && curl https://api.stylogestor.com.br/api/v1/health
```

### Deploy dos Next.js apps

CI/CD via GitHub Actions (`.github/workflows/deploy.yml`) faz automático. Manual:

```bash
ssh root@82.25.65.201
cd /opt/stylogestor
git pull origin master
cd apps/web && pnpm install && pnpm build
pm2 restart stylo-web
```

### Rollback rápido

```bash
ssh root@82.25.65.201
cd /opt/stylogestor
git log --oneline -10                 # achar commit anterior bom
git reset --hard <commit-sha>
cd packages/api && npm run build && pm2 restart stylo-api
# ou idem pros Next apps
```

---

## 💾 Backup & Restore

### Backup automático

Cron diário em `/etc/cron.d/stylogestor-backup` chama `/opt/stylogestor/infra/scripts/backup-db.sh`.
Backups em `/var/backups/stylogestor/` com retenção 7 dias.

### Backup manual

```bash
ssh root@82.25.65.201
sudo /opt/stylogestor/infra/scripts/backup-db.sh
ls -la /var/backups/stylogestor/  # confirmar arquivo novo
```

### Restore (CUIDADO — sobrescreve DB inteiro)

```bash
# 1. Parar apps que escrevem
pm2 stop stylo-api stylo-web stylo-admin stylo-booking

# 2. Backup atual antes (segurança)
sudo /opt/stylogestor/infra/scripts/backup-db.sh

# 3. Identificar backup desejado
ls -la /var/backups/stylogestor/

# 4. Restore (substitui DATA pelo timestamp)
gunzip -c /var/backups/stylogestor/stylogestor-YYYYMMDD-HHMM.sql.gz | \
  sudo -u postgres psql -d stylogestor

# 5. Subir apps
pm2 start all
```

---

## 🔑 Trocar secrets

### Stripe webhook secret

1. No painel Stripe, revela o secret novo
2. No VPS: `export NEW_STRIPE_SECRET="whsec_xxxx"`
3. Roda comando atômico em `/opt/stylogestor/infra/scripts/rotate-stripe-secret.sh`
4. Restart `pm2 restart stylo-api`

### Senha do Postgres

1. SSH no VPS
2. `sudo -u postgres psql -d stylogestor -c "ALTER USER stylogestor WITH PASSWORD 'nova-senha-sem-caracteres-especiais';"`
3. Atualizar `.env` dos 3 arquivos:
   - `/opt/stylogestor/apps/web/.env.production.local`
   - `/opt/stylogestor/apps/admin/.env.production.local`
   - `/opt/stylogestor/packages/api/.env`
4. `pm2 restart all`

**⚠️ Nunca use caracteres `@`, `#`, `/`, `:`, `?`, `=`, `&` em senha** — quebra URL de conexão.

---

## 📊 Monitoria

- **UptimeRobot**: alerta no email quando `https://api.stylogestor.com.br/api/v1/health` retornar != 200 por 2 ciclos seguidos (5 min)
- **Sentry**: alerta no email pra novos erros não-capturados
- **PM2 logs rotativos**: `/root/.pm2/logs/` (limit 10MB por arquivo, retenção 30 dias)

### Ver logs em tempo real

```bash
pm2 logs                    # todos os apps
pm2 logs stylo-api          # só API
pm2 logs --err              # só erros
```

---

## 🛠️ Manutenção planejada

### Update do Node/npm

```bash
# 1. Avisar usuários (se downtime esperado)
# 2. Backup DB
sudo /opt/stylogestor/infra/scripts/backup-db.sh

# 3. Update Node via nvm
nvm install --lts
nvm use --lts

# 4. Reinstalar deps
cd /opt/stylogestor && pnpm install

# 5. Rebuild + restart
cd packages/api && npm run build
pm2 restart all
```

### Update do Postgres (major version)

- Operação não-trivial, requer dump+restore. Procure documentação Postgres oficial.

---

## 📝 Lições aprendidas (post-mortems)

Quando der pau em produção e for resolvido, adicione aqui:

| Data | Incidente | Causa raiz | Como evitar |
|---|---|---|---|
| 2026-05-17 | API com `DATABASE_URL=undefined` | Script de swap de senha gravou string "undefined" quando var de env estava unset | Validar `process.env.NEW_PASS` antes do replace (não usar fallback silencioso) |
| 2026-05-18 | Build ESM em prod | tsc default usa esnext/bundler do tsconfig, Node CJS quebra | `packages/api/scripts/build.js` swap automático |
