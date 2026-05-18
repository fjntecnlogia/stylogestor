# 🔐 GitHub Secrets — Deploy automático STYLOGESTOR

Documentação dos secrets necessários no GitHub pra que o workflow
`.github/workflows/deploy.yml` consiga fazer SSH na VPS Hostinger e
rodar `infra/vps/deploy-pm2.sh` a cada push em `master`.

> A VPS roda os 5 apps via **PM2** (não Docker). O workflow só precisa
> de credenciais SSH — não há Docker Hub envolvido.

## Como configurar

GitHub → Repo `stylogestor` → **Settings** → **Secrets and variables** →
**Actions** → **New repository secret**.

## Secrets obrigatórios (3)

| Nome | Valor | Como obter |
|---|---|---|
| `VPS_HOST` | IP da VPS | Painel Hostinger → VPS → **Endereço IP** |
| `VPS_USER` | Usuário SSH (`root` ou similar) | O mesmo que você usa pra `ssh USER@IP` |
| `VPS_SSH_KEY` | **Chave privada SSH** (texto inteiro com `-----BEGIN…END-----`) | Ver "Gerando chave SSH" abaixo |

## Secret opcional

| Nome | Valor | Quando usar |
|---|---|---|
| `VPS_PORT` | Porta SSH | Só se SSH da VPS não é 22 |

## Gerando chave SSH dedicada pro CI

Não use sua chave pessoal — gera uma dedicada (se vazar você revoga só essa).

### No Windows (PowerShell)

```powershell
# 1. Cria a pasta se não existir
New-Item -ItemType Directory -Force -Path "$HOME\.ssh"

# 2. Gera a chave (aperta Enter 2x na senha — CI não digita senha)
ssh-keygen -t ed25519 -f "$HOME\.ssh\stylogestor_deploy" -C "github-actions"

# 3. Copia a pública pra VPS (substitui IP_DA_VPS)
type "$HOME\.ssh\stylogestor_deploy.pub" | ssh root@IP_DA_VPS "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

# 4. Testa que conecta sem senha
ssh -i "$HOME\.ssh\stylogestor_deploy" root@IP_DA_VPS "echo OK && pm2 list | head"
```

### No Linux/Mac (Bash)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/stylogestor_deploy -C "github-actions"
ssh-copy-id -i ~/.ssh/stylogestor_deploy.pub root@IP_DA_VPS
ssh -i ~/.ssh/stylogestor_deploy root@IP_DA_VPS 'echo OK && pm2 list | head'
```

### Coloca a chave privada no GitHub

```powershell
# Windows
Get-Content "$HOME\.ssh\stylogestor_deploy"
```

```bash
# Linux/Mac
cat ~/.ssh/stylogestor_deploy
```

Copia o output **completo** (do `-----BEGIN OPENSSH PRIVATE KEY-----` até
`-----END OPENSSH PRIVATE KEY-----`, inclusive essas linhas) e cola no
secret `VPS_SSH_KEY`.

## Pré-requisitos na VPS

Antes do primeiro deploy automático, conferir:

```bash
# 1. Repo está em /opt/stylogestor com remote certo
cd /opt/stylogestor && git remote -v
# Deve mostrar: origin https://github.com/fjntecnlogia/stylogestor.git

# 2. Branch master existe e tracked
git branch -a | grep master

# 3. pnpm instalado
which pnpm && pnpm --version
# Deve mostrar 10.x

# 4. Node 20+
node --version

# 5. PM2 instalado e gerenciando os 5 apps
pm2 list
# Deve listar: stylo-api, stylo-web, stylo-admin, stylo-booking, stylo-site

# 6. Variáveis de ambiente carregadas pelo PM2
pm2 env 0   # Confere que NEXT_PUBLIC_*, DATABASE_URL, CLERK_SECRET_KEY etc estão lá
```

Se algum desses estiver faltando, o deploy automático vai falhar nessa
etapa específica. Os logs do GitHub Actions vão mostrar o erro.

## Testando o deploy automático

Após configurar os 3 secrets:

1. Abre: `https://github.com/fjntecnlogia/stylogestor/actions/workflows/deploy.yml`
2. Clica em **"Run workflow"** → branch `master` → **Run workflow** (verde)
3. Acompanha o run em tempo real

Se passar nas 2 etapas (Quality → Deploy), `app.stylogestor.com.br` já
está com o código novo. Daqui pra frente, todo push em `master` que tocar
em `apps/`, `packages/` ou `infra/` dispara automático.

## Em caso de falha

**Erros típicos:**

| Erro nos logs | Causa | Fix |
|---|---|---|
| `Permission denied (publickey)` | Chave SSH na VPS não bate com a do secret | Refazer passo 3 do "Gerando chave SSH" |
| `Host key verification failed` | Primeira conexão da Action | Já mitigado por `script_stop: true` no workflow |
| `bash: pnpm: command not found` | pnpm não tá no PATH do user no SSH | `npm i -g pnpm@10` na VPS |
| `No such file or directory: /opt/stylogestor` | Repo não tá clonado lá | `cd /opt && sudo git clone https://github.com/fjntecnlogia/stylogestor.git && sudo chown -R $USER /opt/stylogestor` |
| `pm2: command not found` | PM2 não global | `npm i -g pm2` |
| `error: cannot lock ref 'HEAD'` | git index corrompido | SSH na VPS, `git reset --hard HEAD` e tentar de novo |

Logs do deploy ficam no GitHub Actions. Logs dos apps depois do deploy:
```bash
ssh root@IP_DA_VPS "pm2 logs stylo-api --lines 100"
```

## Variáveis de ambiente de prod (separadas dos secrets)

`NEXT_PUBLIC_*`, `DATABASE_URL`, `CLERK_SECRET_KEY` etc. moram **na VPS**,
carregadas pelo PM2 — **não no GitHub Secrets**.

Configurar via `pm2 ecosystem` (`ecosystem.config.js`) ou `.env` que o PM2
lê. Variáveis críticas:

```
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAGARME_API_KEY=...
ULTRAMSG_TOKEN=...
ULTRAMSG_INSTANCE=...
RESEND_API_KEY=re_...
NEXT_PUBLIC_API_URL=https://api.stylogestor.com.br
NEXT_PUBLIC_APP_URL=https://app.stylogestor.com.br
NEXT_PUBLIC_USE_MOCKS=false           # sempre false em prod
NEXT_PUBLIC_SUPPORT_WHATSAPP=5565996952828
```
