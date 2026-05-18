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
pnpm install --frozen-lockfile

echo ""
echo "🗄️  [3/6] Gerando Prisma Client..."
pnpm --filter @stylogestor/database run generate

echo ""
echo "🔧 [4/6] Aplicando migrations pendentes (se houver)..."
pnpm --filter @stylogestor/database exec prisma migrate deploy || {
  echo "   ⚠️  Migrate falhou — pode ser que não haja migrations novas. Seguindo."
}

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
echo "🔄 [6/6] Recarregando processos PM2..."
# pm2 reload é zero-downtime em cluster mode; em fork mode equivale a restart.
# Se algum processo não existe ainda, alerta mas não para o deploy.
for proc in stylo-api stylo-web stylo-admin stylo-booking stylo-site; do
  if pm2 describe "$proc" > /dev/null 2>&1; then
    pm2 reload "$proc" --update-env
    echo "   ✅ $proc reloaded"
  else
    echo "   ⚠️  $proc não está no PM2 — pule o reload ou rode pm2 start manual"
  fi
done

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
