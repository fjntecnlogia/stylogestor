# Admin SaaS — Setup do Clerk (passos manuais)

Pra o admin (`admin.stylogestor.com.br`) funcionar com auth, **2 passos manuais**
são necessários DEPOIS do primeiro deploy. Não dá pra automatizar — exige
acesso ao Clerk Dashboard.

## 1. Adicionar `admin.stylogestor.com.br` como satellite domain no Clerk

Sem isso, o login no admin não funciona (mismatch de origin).

1. Acesse https://dashboard.clerk.com → seu app de **produção**
2. **Domains** → **Add satellite domain**
3. Digite: `admin.stylogestor.com.br`
4. Save

> Se já adicionou os outros subdomínios (app/booking/site), basta repetir
> com o `admin`. Cloudflare DNS já tem CNAME apontando.

## 2. Liberar seu email como super_admin

Duas formas — qualquer uma serve:

### Opção A — Via env var na VPS (mais fácil)

SSH na VPS e edite o `.env.production.local` do admin:

```bash
ssh root@<vps>
nano /opt/stylogestor/apps/admin/.env.production.local
# Adicionar (ou editar) a linha:
ADMIN_EMAILS=fjntecnologia2022@gmail.com
# Pra múltiplos: ADMIN_EMAILS=fjn@x.com,outro@y.com
```

Depois aplicar o env:

```bash
pm2 restart stylo-admin --update-env
```

### Opção B — Via publicMetadata no Clerk Dashboard

1. https://dashboard.clerk.com → **Users**
2. Clique no seu usuário
3. **Public metadata** → cole:
   ```json
   { "role": "super_admin" }
   ```
   (Mantém `tenantSlug`/`tenantName` se já existirem.)
4. Save

Vantagem: persiste entre máquinas, não precisa SSH.

## Como saber que funcionou?

1. Abra `admin.stylogestor.com.br`
2. Cai em `/login` → login com Clerk
3. Após login deve ir direto pra `/` (dashboard admin)
4. Se cair em `/acesso-negado`, o passo 2 não foi feito → leia a mensagem
   da própria página, ela explica.

## Rotacionar acesso depois

- Tirar alguém: remover email do `ADMIN_EMAILS` + `pm2 restart`
- Adicionar alguém: append email + `pm2 restart`
- Banir totalmente: deletar usuário do Clerk Dashboard
