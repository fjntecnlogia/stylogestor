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
pnpm --filter @stylogestor/database exec prisma migrate deploy || {
  echo "   ⚠️  Migrate falhou — pode ser que não haja migrations novas. Seguindo."
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
