#!/usr/bin/env bash
# ============================================================
# STYLOGESTOR — Deploy real na VPS Hostinger via PM2
# Reflete o setup que está em produção hoje:
#   - 5 apps gerenciados por PM2 (stylo-api, stylo-web, stylo-admin,
#     stylo-booking, stylo-site)
#   - pnpm + node nativo (sem Docker pros apps)
#   - Postgres/Redis podem ser containers separados, mas os apps Node não
#
# Usado pelo .github/workflows/deploy.yml (push em master) e também
# manualmente: `cd /opt/stylogestor && bash infra/vps/deploy-pm2.sh`
# ============================================================
set -euo pipefail

APP_DIR="/opt/stylogestor"
BRANCH="master"

# CI=true faz o pnpm rodar em modo non-interactive (sem prompts).
# Sem isso, o install pode abortar pedindo confirmação que nunca vem
# (ex: ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY).
export CI=true

cd "$APP_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Deploy STYLOGESTOR — $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📥 [1/6] Atualizando código (branch $BRANCH)..."
git fetch --all --prune
git checkout "$BRANCH"
# Reset hard + clean garantem que mudanças locais (rebuild de tsconfig,
# arquivos temporários do PM2/build) não atrapalhem o git operations.
git reset --hard "origin/$BRANCH"
git clean -fd --exclude='node_modules' --exclude='.next' --exclude='dist'
echo "   HEAD: $(git log --oneline -1)"

echo ""
echo "📦 [2/6] Instalando dependências..."
# CI=true inline + --config flag pra evitar prompt interativo de purge.
# Sem essas flags, pnpm 11 aborta com ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY
# quando precisa limpar node_modules legado.
CI=true pnpm install --frozen-lockfile --config.confirm-modules-purge=false

echo ""
echo "🗄️  [3/6] Gerando Prisma Client..."
pnpm --filter @stylogestor/database run generate

echo ""
echo "🔧 [4/6] Aplicando migrations pendentes (se houver)..."
# Prisma precisa do DATABASE_URL no environment. O env real está nos
# `.env.production.local` de cada app, mas o `prisma migrate deploy`
# roda no contexto do packages/database. Extrai a URL do web (que é
# a fonte de verdade da prod) e injeta inline.
WEB_ENV="$APP_DIR/apps/web/.env.production.local"
if [ -f "$WEB_ENV" ] && grep -q "^DATABASE_URL=" "$WEB_ENV"; then
  # shellcheck disable=SC2155
  export DATABASE_URL=$(grep "^DATABASE_URL=" "$WEB_ENV" | head -1 | cut -d'=' -f2-)
  # Tira aspas se vierem
  DATABASE_URL="${DATABASE_URL%\"}"
  DATABASE_URL="${DATABASE_URL#\"}"
  DATABASE_URL="${DATABASE_URL%\'}"
  DATABASE_URL="${DATABASE_URL#\'}"
  export DATABASE_URL
  echo "   ✓ DATABASE_URL carregado do web/.env.production.local"
else
  echo "   ⚠️  DATABASE_URL não encontrado em $WEB_ENV — migrate vai falhar"
fi

# Baseline retroativo: o banco tem tabelas antigas (Tenant, Client, etc)
# criadas via `db push` sem registro no _prisma_migrations. O Prisma
# aborta com P3005 'schema is not empty'. Solução: lista HARDCODED de
# migrations que sabidamente já estão aplicadas no banco — marca elas
# como `applied` no _prisma_migrations (idempotente, falha silencioso
# se já marcada). Migrations NOVAS são aplicadas normal por migrate deploy.
#
# IMPORTANTE: pra cada migration nova futura, deixar fora dessa lista.
# Após o deploy aplicar com sucesso, ADICIONE aqui pro próximo deploy
# ser idempotente. Sem isso, migrate resolve --applied pode pular
# migrations que ainda não rodaram (bug que tivemos com cash_closures).
LEGACY_APPLIED_MIGRATIONS="
20260517_add_webhook_events
20260519_add_system_settings_and_promo_codes
20260519_add_cash_closures
20260519_add_professional_blocks
20260520_add_system_logs
20260528_user_supabase_id
"
for mig in $LEGACY_APPLIED_MIGRATIONS; do
  if [ -n "$mig" ]; then
    pnpm --filter @stylogestor/database exec prisma migrate resolve --applied "$mig" 2>/dev/null || true
  fi
done

# Roda migrate deploy. Se falhar, ABORTA — antes era || true, mas isso
# mascarava erros graves (tipo a missing column que quebrou o promo-codes).
pnpm --filter @stylogestor/database exec prisma migrate deploy || {
  echo "   ❌ Migrate FALHOU — abortando deploy pra não publicar app com schema desincronizado."
  exit 1
}

echo ""
echo "🛡️  [4.5/6] Garantindo flags de build (mocks OFF em prod)..."
# NEXT_PUBLIC_USE_MOCKS é lido em build-time pelo Next (inline no bundle
# client). Em prod, queremos OFF — fixtures retornam [] e dashboard mostra
# empty state ao invés de dados fake. Idempotente: adiciona se faltar,
# substitui se presente. Aplicado em web (gestor/barbeiro) e admin (SaaS).
for app in apps/web apps/admin; do
  ENV_FILE="$APP_DIR/$app/.env.production.local"
  touch "$ENV_FILE"
  if grep -q "^NEXT_PUBLIC_USE_MOCKS=" "$ENV_FILE"; then
    sed -i 's/^NEXT_PUBLIC_USE_MOCKS=.*/NEXT_PUBLIC_USE_MOCKS=false/' "$ENV_FILE"
  else
    echo "NEXT_PUBLIC_USE_MOCKS=false" >> "$ENV_FILE"
  fi
  echo "   ✓ $ENV_FILE — NEXT_PUBLIC_USE_MOCKS=false"
done

# ─── [4.5b] Supabase no web (Fase 3 — login único Clerk→Supabase) ───
# O web migrou pra Supabase Auth. Os clients (@supabase/ssr) leem
# NEXT_PUBLIC_SUPABASE_URL/ANON_KEY em BUILD-time. A API já tem
# SUPABASE_URL + SUPABASE_ANON_KEY no .env — copiamos pro web como
# NEXT_PUBLIC_* (mesma instância = unifica identidade com o mobile).
# Sem isso, o middleware (createServerClient com env undefined) quebra
# TODA request. Idempotente: só adiciona se faltar.
WEB_ENV="$APP_DIR/apps/web/.env.production.local"
API_ENV="$APP_DIR/packages/api/.env"
touch "$WEB_ENV"
copy_supabase_to_web() {
  local pub_var=$1   # nome NEXT_PUBLIC_* no web
  local src_var=$2   # nome no .env da API
  if ! grep -q "^${pub_var}=" "$WEB_ENV"; then
    local value
    value=$(grep "^${src_var}=" "$API_ENV" 2>/dev/null | head -1 | cut -d'=' -f2-)
    if [ -n "$value" ]; then
      echo "${pub_var}=${value}" >> "$WEB_ENV"
      echo "   ✓ Web recebeu ${pub_var} (de ${src_var} da API)"
    else
      echo "   ⚠️  ${src_var} ausente na API — web precisa setar ${pub_var} manualmente (cutover Supabase quebra sem isso)"
    fi
  fi
}
copy_supabase_to_web "NEXT_PUBLIC_SUPABASE_URL" "SUPABASE_URL"
copy_supabase_to_web "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_ANON_KEY"

# ─── Bootstrap Clerk no admin ──────────────────────────────────────
# O admin agora exige login Clerk + role super_admin (ou email no
# allowlist ADMIN_EMAILS). Se as keys do Clerk ainda não estão no
# .env.production.local do admin, copia do web (que já está
# configurado em produção). Idempotente — só preenche o que falta.
WEB_ENV="$APP_DIR/apps/web/.env.production.local"
ADMIN_ENV="$APP_DIR/apps/admin/.env.production.local"
copy_if_missing() {
  local var=$1
  if ! grep -q "^${var}=" "$ADMIN_ENV"; then
    local value
    value=$(grep "^${var}=" "$WEB_ENV" | head -1 | cut -d'=' -f2-)
    if [ -n "$value" ]; then
      echo "${var}=${value}" >> "$ADMIN_ENV"
      echo "   ✓ Admin recebeu $var do web"
    else
      echo "   ⚠️  $var ausente no web — admin precisa setar manualmente"
    fi
  fi
}
copy_if_missing "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
copy_if_missing "CLERK_SECRET_KEY"
copy_if_missing "DATABASE_URL"

# Fixar a rota de sign-in pra /login (mesma do web). Sem essa env var,
# Clerk fallbacks pro default da org no Dashboard — se descasar da
# rota real no app, vira loop infinito de redirect + HTTP 431.
set_var() {
  local var=$1; local val=$2
  if grep -q "^${var}=" "$ADMIN_ENV"; then
    sed -i "s|^${var}=.*|${var}=${val}|" "$ADMIN_ENV"
  else
    echo "${var}=${val}" >> "$ADMIN_ENV"
  fi
}
set_var "NEXT_PUBLIC_CLERK_SIGN_IN_URL" "/login"
set_var "NEXT_PUBLIC_CLERK_SIGN_UP_URL" "/login"

# ADMIN_EMAILS controla quem pode entrar no admin. Default = dono do
# sistema (FJN Tecnologia). Pra adicionar/trocar admins depois, edite
# manualmente o $ADMIN_ENV na VPS e rode `pm2 restart stylo-admin --update-env`.
DEFAULT_ADMIN_EMAILS="fjntecnologia2022@gmail.com"
if ! grep -q "^ADMIN_EMAILS=" "$ADMIN_ENV"; then
  echo "ADMIN_EMAILS=${DEFAULT_ADMIN_EMAILS}" >> "$ADMIN_ENV"
  echo "   ✓ ADMIN_EMAILS=${DEFAULT_ADMIN_EMAILS} (default)"
else
  # Se já existe mas está vazio, popula com o default. Não sobrescreve
  # se já tem algo configurado manualmente.
  CURRENT=$(grep "^ADMIN_EMAILS=" "$ADMIN_ENV" | cut -d'=' -f2-)
  if [ -z "$CURRENT" ]; then
    sed -i "s|^ADMIN_EMAILS=.*|ADMIN_EMAILS=${DEFAULT_ADMIN_EMAILS}|" "$ADMIN_ENV"
    echo "   ✓ ADMIN_EMAILS estava vazio → setado pra ${DEFAULT_ADMIN_EMAILS}"
  else
    echo "   ✓ ADMIN_EMAILS já configurado (não sobrescrevo)"
  fi
fi

echo ""
echo "🔖 [4.7/6] Gravando GIT_SHA + BUILD_TIME no env de cada app..."
# /api/health (de cada app) lê NEXT_PUBLIC_GIT_SHA e NEXT_PUBLIC_BUILD_TIME
# pra reportar versão no painel admin > Sistema. Idempotente — substitui
# se presente, adiciona se não.
GIT_SHA_VAL=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
BUILD_TIME_VAL=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
for app in apps/web apps/admin apps/site apps/booking; do
  ENV_FILE="$APP_DIR/$app/.env.production.local"
  touch "$ENV_FILE"
  for kv in "NEXT_PUBLIC_GIT_SHA=$GIT_SHA_VAL" "NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME_VAL"; do
    key="${kv%%=*}"
    if grep -q "^${key}=" "$ENV_FILE"; then
      sed -i "s|^${key}=.*|${kv}|" "$ENV_FILE"
    else
      echo "$kv" >> "$ENV_FILE"
    fi
  done
done
echo "   ✓ GIT_SHA=${GIT_SHA_VAL:0:7}  BUILD_TIME=$BUILD_TIME_VAL"

echo ""
echo "🔨 [5/6] Buildando apps..."
# Build em paralelo via turbo (mais rápido); fallback sequencial se turbo
# não estiver configurado.
if [ -f turbo.json ]; then
  pnpm turbo run build --filter='./apps/*' --filter='./packages/api'
else
  pnpm --filter @stylogestor/api build
  pnpm --filter web build
  pnpm --filter admin build
  pnpm --filter booking build
  pnpm --filter site build
fi

echo ""
echo "🔄 [6/6] Reload/start dos processos PM2 via ecosystem.config.js..."
# Usa o ecosystem.config.js como fonte da verdade da config (cwd, porta,
# exec_mode). Se algum processo já existe, recarrega; se não, cria.
# Isso evita "drift" (alguém alterou config manualmente e o reload usa a
# config local do PM2, não a definida no repo).
ECOSYSTEM_FILE="$APP_DIR/infra/vps/ecosystem.config.js"

if [ ! -f "$ECOSYSTEM_FILE" ]; then
  echo "   ❌ ecosystem.config.js não encontrado em $ECOSYSTEM_FILE"
  exit 1
fi

# `pm2 startOrReload` lê o ecosystem e:
#   - inicia processos que não existem
#   - reload (zero-downtime cluster, restart fork) dos que já existem
#   - atualiza env vars e args com --update-env
pm2 startOrReload "$ECOSYSTEM_FILE" --update-env

pm2 save > /dev/null

# ─── [7/7] Crontab — lembrete trial + lembrete agendamento 24h ─────────
# Idempotente via markers # STYLOGESTOR_CRON_{START,END}. A cada deploy:
#   1. Garante que CRON_SECRET existe no apps/web/.env.production.local
#      (gera string aleatória de 64 chars na primeira execução)
#   2. Reescreve o bloco entre os markers no crontab do root
# Resultado: cron 100% configurado sem precisar SSH manual.
echo ""
echo "⏰ [7/7] Configurando crontab de lembretes..."

WEB_ENV="$APP_DIR/apps/web/.env.production.local"
if ! grep -q "^CRON_SECRET=" "$WEB_ENV"; then
  NEW_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -d '/+=' | head -c 64)
  echo "CRON_SECRET=${NEW_SECRET}" >> "$WEB_ENV"
  echo "   ✓ CRON_SECRET gerado (primeira vez) e salvo em $WEB_ENV"
  # Reinicia web pra carregar o novo env var
  pm2 restart stylo-web --update-env > /dev/null 2>&1 || true
fi
CRON_SECRET_VALUE=$(grep "^CRON_SECRET=" "$WEB_ENV" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")

# Atualiza crontab — preserva linhas existentes, troca só o bloco STYLOGESTOR_CRON
CRON_TMP=$(mktemp)
crontab -l 2>/dev/null | sed '/# STYLOGESTOR_CRON_START/,/# STYLOGESTOR_CRON_END/d' > "$CRON_TMP" || true
cat >> "$CRON_TMP" <<EOF
# STYLOGESTOR_CRON_START — managed by deploy-pm2.sh, do NOT edit manually
# Trial expirando (3d / 1d / hoje) — roda 09:00 BRT diariamente
0 9 * * * curl -fsS -H "X-Cron-Secret: ${CRON_SECRET_VALUE}" https://app.stylogestor.com.br/api/cron/trial-warnings >> /var/log/stylogestor-cron.log 2>&1
# Lembrete WhatsApp 24h antes do agendamento — roda de hora em hora
0 * * * * curl -fsS -H "X-Cron-Secret: ${CRON_SECRET_VALUE}" https://app.stylogestor.com.br/api/cron/appointment-reminders >> /var/log/stylogestor-cron.log 2>&1
# STYLOGESTOR_CRON_END
EOF
crontab "$CRON_TMP"
rm -f "$CRON_TMP"

# Garante que o log file existe e o cron consegue escrever
touch /var/log/stylogestor-cron.log 2>/dev/null || true
echo "   ✓ Crontab atualizado (2 jobs: trial-warnings 09h diário · appointment-reminders por hora)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deploy concluído: $(date '+%Y-%m-%d %H:%M:%S')"
echo "   Dashboard:  https://app.stylogestor.com.br"
echo "   API:        https://api.stylogestor.com.br"
echo "   Site:       https://stylogestor.com.br"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Status final dos processos:"
pm2 list
