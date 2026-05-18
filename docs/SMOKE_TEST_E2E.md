# Smoke Test End-to-End — Billing flow

Como validar que checkout Stripe real chega até o DB com tudo correto.

## Pré-requisitos

- Conta de teste no Clerk (não a sua principal — não queremos sujar dados)
- Modo **Test** do Stripe ativado (use `sk_test_...` no `.env`)
- Acesso ao painel Sentry (pra ver erros se algo der ruim)
- Acesso SSH ao VPS (pra ver logs em real-time)

## Cenário 1 — Checkout completo (assinatura ativa)

### 1. Setup do tenant de teste

No browser:
1. Vai em `https://app.stylogestor.com.br/cadastro`
2. Cria conta com email teste (ex: `teste-billing@seudominio.com`)
3. Completa onboarding (escolhe nome de barbearia, etc.)
4. Anota o `tenantId` que aparecer (ou deduz pelo slug)

### 2. Checkout

1. Vai em `https://app.stylogestor.com.br/planos`
2. Escolhe **Pro** (R$ 149/mês)
3. No checkout do Stripe, use cartão de **teste**:
   - Número: `4242 4242 4242 4242`
   - CVC: qualquer 3 dígitos
   - Validade: qualquer data futura
   - Nome: qualquer
4. Confirma

### 3. Em paralelo, no VPS, abre logs

```bash
pm2 logs stylo-api --lines 0 --raw &
LOGS_PID=$!
# Quando ver os eventos chegarem, aperta Ctrl+C ou:
sleep 30 && kill $LOGS_PID 2>/dev/null
```

Esperado nos logs (em ordem):
```
Stripe event: checkout.session.completed (evt_...)
✅ Assinatura ativada: Tenant <id> → Plano PRO
Clerk metadata: clerkId=<id> status=active plan=PRO
Stripe event: customer.subscription.created (evt_...)
Stripe event: invoice.payment_succeeded (evt_...)
💰 Pagamento confirmado: R$ 149.00 | Tenant <id>
```

### 4. Validar no DB

```bash
sudo -u postgres psql -d stylogestor <<'SQL'
SELECT t.slug, t.plan, s.status, s."stripeSubId", s."currentPeriodEnd"
FROM tenants t
LEFT JOIN subscriptions s ON s."tenantId" = t.id
WHERE t.slug LIKE 'teste%' OR t.name LIKE 'Teste%'
ORDER BY t."createdAt" DESC LIMIT 5;
SQL
```

Esperado:
- `plan = PRO`
- `status = active`
- `stripeSubId` populado
- `currentPeriodEnd` ~30 dias no futuro

### 5. Validar no Clerk

1. Painel Clerk → **Users**
2. Acha o user de teste
3. Aba **Metadata** → **Public**
4. Esperado: `{ "subscriptionStatus": "active", "plan": "PRO", "stripeSubId": "sub_..." }`

### 6. Email de boas-vindas (Resend)

Conferir caixa de entrada do email de teste — deve chegar `🎉 Bem-vindo ao STYLOGESTOR, <nome>!` em ~30s.

Se não chegar:
- Painel do Resend → **Logs** → procurar pelo email
- Verifica `RESEND_API_KEY` no `.env` da API

---

## Cenário 2 — Cancelamento

1. No app: `https://app.stylogestor.com.br/planos` → **Cancelar assinatura** (chama portal Stripe)
2. No portal Stripe: **Cancelar imediatamente** (test mode permite)
3. Logs esperados:
   ```
   Stripe event: customer.subscription.deleted (evt_...)
   ❌ Assinatura cancelada: Tenant <id>
   Clerk metadata: clerkId=<id> status=canceled
   ```
4. DB: `tenant.plan = FREE`, `subscription.status = canceled`, `canceledAt = now`
5. Clerk metadata: `subscriptionStatus = canceled`
6. Tenta acessar dashboard: middleware Next deve redirecionar pra `/bloqueado`

---

## Cenário 3 — Pagamento falho

1. No Stripe **Test**: usa cartão `4000 0000 0000 9995` (sempre falha cobrança)
2. Aguarda próxima cobrança recorrente (em modo test, dá pra forçar via "advance clock" no painel)
3. Logs esperados:
   ```
   Stripe event: invoice.payment_failed (evt_...)
   ⚠️ Pagamento falhou: Tenant <id>
   Clerk metadata: clerkId=<id> status=past_due
   ```
4. DB: `subscription.status = past_due`
5. Email **PaymentFailed** chega na inbox
6. Middleware Next bloqueia acesso a rotas não-pagamento (`/dashboard` redireciona pra `/bloqueado`)

---

## Cenário 4 — Validar cache Redis

```bash
# 1. Limpa cache do tenant (caso já cacheado)
INT_KEY=$(grep '^INTERNAL_API_KEY=' /opt/stylogestor/packages/api/.env | cut -d= -f2)

# 2. Faz request — primeira é miss (vai no DB)
time curl -s -H "x-internal-key: $INT_KEY" \
  "https://api.stylogestor.com.br/api/v1/tenants/by-slug/<seu-slug>" > /dev/null

# 3. Repete — agora é hit (Redis)
time curl -s -H "x-internal-key: $INT_KEY" \
  "https://api.stylogestor.com.br/api/v1/tenants/by-slug/<seu-slug>" > /dev/null
```

A 2ª request deve ser **bem mais rápida** (Redis ~30ms vs DB ~150ms+).

Confere no painel Upstash → Data Browser que tem `cache:tenant:slug:<seu-slug>`.

---

## Cenário 5 — Rate limit por tenant

Pra simular abuse (faz 700 requests em 60s):

```bash
TOKEN="<clerk-jwt-do-usuario-de-teste>"
TENANT_SLUG="<seu-slug>"

for i in $(seq 1 700); do
  curl -s -o /dev/null -w "%{http_code} " \
    -H "Authorization: Bearer $TOKEN" \
    -H "x-tenant-slug: $TENANT_SLUG" \
    "https://api.stylogestor.com.br/api/v1/clients"
done
echo ""
```

Esperado: a partir da request ~600, começam a aparecer **429** no lugar de 200.

Logs do PM2:
```
WARN [TenantThrottleGuard] Rate limit por tenant excedido: tenant=<id> count=601/600
```

Para resetar: espera 1min ou apaga `throttle:tenant:<id>:*` no Redis.

---

## Limpeza pós-teste

```bash
# 1. Apaga tenant de teste do DB
sudo -u postgres psql -d stylogestor -c \
  "DELETE FROM tenants WHERE slug LIKE 'teste%';"

# 2. Apaga user de teste do Clerk (painel: Users → Delete)

# 3. Apaga subscription de teste do Stripe (painel: Customers → Delete)
```
