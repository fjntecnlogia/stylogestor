# 🔐 GitHub Secrets — Deploy automático STYLOGESTOR

Documentação dos secrets necessários no GitHub pra que o workflow
`.github/workflows/deploy.yml` consiga fazer build + deploy automático
na VPS Hostinger a cada push em `master`.

## Como configurar

GitHub → Repo `stylogestor` → **Settings** → **Secrets and variables** →
**Actions** → **New repository secret**.

## Secrets obrigatórios

### Docker Hub (job `build`)

| Nome | Valor | Como obter |
|---|---|---|
| `DOCKER_USERNAME` | Seu username no Docker Hub | Conta em [hub.docker.com](https://hub.docker.com) |
| `DOCKER_PASSWORD` | Access Token do Docker Hub | hub.docker.com → Account Settings → Security → **New Access Token** (escopo: Read, Write, Delete) |

> ⚠️ Use **Access Token**, não a senha da conta. Token pode ser revogado.

### VPS Hostinger (job `deploy`)

| Nome | Valor | Como obter |
|---|---|---|
| `VPS_HOST` | IP ou hostname da VPS | Painel Hostinger → VPS → **Endereço IP** |
| `VPS_USER` | Usuário SSH (ex: `root` ou `deploy`) | Quem você usa no SSH |
| `VPS_SSH_KEY` | **Chave privada** SSH (texto completo, com `-----BEGIN…END-----`) | Ver "Gerando chave SSH" abaixo |
| `VPS_PORT` | Porta SSH (opcional, default 22) | Só preencher se mudou da 22 |

## Gerando chave SSH dedicada pra deploy

Não use sua chave pessoal — gera uma só pro CI:

**Na sua máquina local:**
```bash
ssh-keygen -t ed25519 -f ~/.ssh/stylogestor_deploy -C "github-actions@stylogestor"
# Pressione Enter pra senha vazia (CI não pode digitar senha)
```

Isso gera 2 arquivos:
- `~/.ssh/stylogestor_deploy` → **chave privada** (vai pra `VPS_SSH_KEY` no GitHub)
- `~/.ssh/stylogestor_deploy.pub` → **chave pública** (vai pra VPS)

**Copia a pública pra VPS:**
```bash
ssh-copy-id -i ~/.ssh/stylogestor_deploy.pub $VPS_USER@$VPS_HOST
# ou manualmente:
cat ~/.ssh/stylogestor_deploy.pub | ssh $VPS_USER@$VPS_HOST 'cat >> ~/.ssh/authorized_keys'
```

**Copia a privada pro GitHub Secret `VPS_SSH_KEY`:**
```bash
cat ~/.ssh/stylogestor_deploy
# Copia o output INTEIRO (incluindo BEGIN/END) e cola no secret
```

**Testa que funciona:**
```bash
ssh -i ~/.ssh/stylogestor_deploy $VPS_USER@$VPS_HOST 'echo OK'
# Deve imprimir "OK" sem pedir senha
```

## Pré-requisitos na VPS

Antes do primeiro deploy automático, a VPS precisa ter:

1. **Repo clonado em `/opt/stylogestor`** (path hardcoded no workflow)
   ```bash
   sudo mkdir -p /opt/stylogestor
   sudo chown $USER:$USER /opt/stylogestor
   git clone https://github.com/fjntecnlogia/stylogestor.git /opt/stylogestor
   cd /opt/stylogestor
   git checkout master
   ```

2. **Arquivo `.env.prod` em `/opt/stylogestor-env/.env.prod`**
   (template em `infra/vps/.env.prod.example`)
   ```bash
   sudo mkdir -p /opt/stylogestor-env
   sudo cp infra/vps/.env.prod.example /opt/stylogestor-env/.env.prod
   sudo nano /opt/stylogestor-env/.env.prod   # preencher valores reais
   sudo chmod 600 /opt/stylogestor-env/.env.prod
   ```

3. **Docker + Docker Compose instalados** (`infra/vps/setup-vps.sh` cuida disso)

4. **Nginx + SSL** (`infra/vps/nginx/` tem a config)

## Testando o deploy

Após configurar os secrets:

```bash
# Trigger manual via Actions (não precisa push)
# GitHub → Actions → "🚀 Deploy STYLOGESTOR" → "Run workflow" → master
```

Ou simplesmente faça push em `master`. O workflow dispara em mudanças
nos paths:
- `apps/**`
- `packages/**`
- `infra/**`
- `Dockerfile.api`
- `package.json` / `pnpm-lock.yaml`
- `.github/workflows/deploy.yml`

## Logs em caso de falha

- **GitHub Actions:** Repo → Actions → click no run que falhou
- **Na VPS:** `cd /opt/stylogestor && docker compose -f infra/vps/docker-compose.prod.yml logs -f --tail=100`

## Variáveis de ambiente de **prod** (separadas dos secrets)

`NEXT_PUBLIC_*` e demais env vars dos apps moram em `/opt/stylogestor-env/.env.prod`
na VPS — **não no GitHub Secrets**. O `deploy.sh` copia esse arquivo pra
`infra/vps/.env.prod` antes de subir os containers.

Variáveis obrigatórias (template em `infra/vps/.env.prod.example`):
- `DATABASE_URL` (Postgres)
- `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `PAGARME_API_KEY`
- `ULTRAMSG_TOKEN` / `ULTRAMSG_INSTANCE`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_API_URL=https://api.stylogestor.com.br`
- `NEXT_PUBLIC_APP_URL=https://app.stylogestor.com.br`
- `NEXT_PUBLIC_USE_MOCKS=false` ← em produção, sempre false
- `NEXT_PUBLIC_SUPPORT_WHATSAPP=5565996952828`
