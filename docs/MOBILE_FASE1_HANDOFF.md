# 🧭 Handoff — Mobile-Gestor consome a API NestJS (Fase 1)

> Documento de execução pro **time Mobile**. Tudo que você precisa pra migrar o
> app do storage local pra API real está aqui. Backend já está em produção e
> testado. Ver também `docs/AUTH_UNIFICATION.md` (visão geral da unificação).

---

## 1. Contexto (leia antes de codar)

Hoje o **mobile-gestor** guarda tudo em `SecureStore` (storage local do device) e a
base de usuários do app era **separada** da web. A gente unificou: a **API NestJS**
(`api.stylogestor.com.br`) agora aceita o **JWT do Supabase** que o app já usa pra
login, cria o usuário no 1º acesso e serve todos os dados reais (multi-tenant).

**Objetivo desta fase:** trocar o storage local por chamadas à API NestJS,
mantendo o app funcionando igual pro usuário.

> Não precisa mexer em servidor nem em env do EAS. O JWT vem da sessão Supabase
> que já existe.

---

## 2. O que já está pronto no app (`git pull` na master)

Arquivos novos, prontos pra usar — **não precisam ser alterados**, só consumidos:

- **`lib/api.ts`** — cliente HTTP autenticado. Injeta **sozinho** em cada request:
  - `Authorization: Bearer <access_token>` (de `supabase.auth.getSession()`, refresh automático)
  - `x-tenant-slug: <slug da barbearia>` (nas rotas tenant-scoped)
  - Exporta: `tenantsApi`, `clientsApi`, `servicesApi`, `professionalsApi`,
    `appointmentsApi`, `financialApi`, `ApiError` e os tipos de input.
- **`lib/tenant.ts`** — fluxo de barbearia: `bootstrapTenant()`, `onboardTenant()`,
  `clearActiveTenant()`, `switchTenant()`, `listMyTenants()`.
- **`app.json`** — já tem `extra.nestApiUrl = "https://api.stylogestor.com.br"`.

---

## 3. Passo a passo de execução

### Passo 1 — Bootstrap depois do login
No gate de autenticação (provavelmente o root `_layout.tsx`), depois que a sessão
Supabase estiver logada, chamar `bootstrapTenant()`:

```ts
import { bootstrapTenant } from '@/lib/tenant'

const r = await bootstrapTenant()
if (r.needsOnboarding) {
  router.replace('/onboarding')        // usuário sem barbearia → cadastrar
} else {
  // r.tenant tem { slug, name, ... }; slug já foi fixado internamente
  router.replace('/(tabs)')            // libera o app normal
}
```

`bootstrapTenant()`:
- chama `GET /tenants/mine`;
- se **tem** barbearia → fixa o slug ativo (memória + SecureStore) e segue;
- se vier `[]` → retorna `{ needsOnboarding: true }`;
- **sem internet** mas com slug salvo de antes → segue offline com ele.

### Passo 2 — Tela de onboarding (criar barbearia)
Quando `needsOnboarding`, mostrar tela coletando nome (obrigatório) + resto opcional:

```ts
import { onboardTenant } from '@/lib/tenant'

await onboardTenant({
  name: 'Barbearia do João',          // único obrigatório
  phone: '(11) 99999-0000',
  city: 'São Paulo',
  schedules: [                        // 0=dom … 6=sáb
    { day: 1, start: '09:00', end: '18:00', active: true },
    { day: 2, start: '09:00', end: '18:00', active: true },
  ],
  professionals: [{ name: 'João', role: 'Barbeiro', commission: 40 }],
  services: [{ name: 'Corte', price: 35, duration: 30 }],
})
router.replace('/(tabs)')             // slug já fica ativo
```

> ⚠️ **NÃO mandar campos fora desse schema.** A API rejeita campos extras
> (`forbidNonWhitelisted` → 400). Campos válidos: `name, type, phone, city, plan,
> schedules[], professionals[], services[]`.

### Passo 3 — Logout
No `signOut`, limpar a barbearia ativa **antes** de deslogar:

```ts
import { clearActiveTenant } from '@/lib/tenant'
await clearActiveTenant()
await supabase.auth.signOut()
```

### Passo 4 — Migrar as libs de dados (o grosso do trabalho)
Trocar o **miolo** de `lib/clientes.ts`, `lib/lancamentos.ts`, `lib/agendamentos.ts`
(hoje SecureStore) por chamadas à API, **mantendo as mesmas assinaturas** pra não
mexer nas telas. Ordem recomendada:
1. **Clientes** → `clientsApi` (pronto)
2. **Financeiro/Lançamentos** → `financialApi` (pronto)
3. **Serviços / Profissionais** → `servicesApi` / `professionalsApi` (pronto)
4. **Agendamentos** → `appointmentsApi` (depende de 1 e 3 — IDs reais)

---

## 4. Exemplos completos de migração

### `lib/clientes.ts`
```ts
import { clientsApi, type CreateClientInput } from './api'

export type Cliente = {
  id: string; name: string; phone: string
  visits: number; spent: number; lastVisit: string; tags: string[]
}

function fromApi(c: any): Cliente {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    visits: c.totalVisits ?? 0,
    spent: Number(c.totalSpent ?? 0),
    lastVisit: c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('pt-BR') : '',
    tags: c.tags ?? [],
  }
}

export async function listClientes(): Promise<Cliente[]> {
  const list = await clientsApi.list()
  return list.map(fromApi)
}

export async function addCliente(c: { name: string; phone: string }): Promise<Cliente> {
  const input: CreateClientInput = { name: c.name, phone: c.phone }
  return fromApi(await clientsApi.create(input))
}
```
> ❗ Remover o `SEED` de clientes mockados.

### `lib/lancamentos.ts`
```ts
import { financialApi, type CreateTransactionInput, type PaymentMethod } from './api'

export type Lancamento = {
  id: string; type: 'IN' | 'OUT'; desc: string
  method: 'PIX' | 'Dinheiro' | 'Cartão' | 'Outro'
  amount: number; date: string; time: string; createdAt: string
}

const metodoParaApi: Record<Lancamento['method'], PaymentMethod> = {
  PIX: 'PIX', Dinheiro: 'CASH', Cartão: 'CREDIT_CARD', Outro: 'OTHER',
}
const metodoDaApi: Record<string, Lancamento['method']> = {
  PIX: 'PIX', CASH: 'Dinheiro', CREDIT_CARD: 'Cartão', DEBIT_CARD: 'Cartão',
  TRANSFER: 'Outro', OTHER: 'Outro',
}

function fromApi(t: any): Lancamento {
  const d = new Date(t.date)
  return {
    id: t.id,
    type: t.type === 'INCOME' ? 'IN' : 'OUT',
    desc: t.description,
    method: metodoDaApi[t.paymentMethod] ?? 'Outro',
    amount: Number(t.amount),
    date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    createdAt: t.createdAt ?? d.toISOString(),
  }
}

export async function listLancamentos(): Promise<Lancamento[]> {
  const hoje = new Date()
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59).toISOString()
  const txs = await financialApi.transactions(ini, fim)
  return txs.map(fromApi)
}

export async function addLancamento(l: Omit<Lancamento, 'id' | 'createdAt'>): Promise<Lancamento> {
  const input: CreateTransactionInput = {
    type: l.type === 'IN' ? 'INCOME' : 'EXPENSE',
    category: 'geral',
    description: l.desc,
    amount: l.amount,
    date: new Date().toISOString(),
    paymentMethod: metodoParaApi[l.method],
  }
  return fromApi(await financialApi.createTransaction(input))
}
```

### `lib/agendamentos.ts`
```ts
import { appointmentsApi, type CreateAppointmentInput } from './api'

// dd/MM + HH:mm (ano atual) → Date
function parseDataHora(ddMM: string, hhmm: string): Date {
  const [d, m] = ddMM.split('/').map(Number)
  const [h, min] = hhmm.split(':').map(Number)
  return new Date(new Date().getFullYear(), m - 1, d, h, min)
}

export async function addAgendamento(a: {
  clienteId: string; profissionalId: string; servicoIds: string[]
  date: string; time: string; price: number; duration: number
}) {
  const start = parseDataHora(a.date, a.time)
  const end = new Date(start.getTime() + a.duration * 60000)
  const input: CreateAppointmentInput = {
    clientId: a.clienteId,            // UUID real (clientsApi)
    professionalId: a.profissionalId, // UUID real (professionalsApi.list)
    serviceIds: a.servicoIds,         // UUIDs reais (servicesApi.list)
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    totalPrice: a.price,
    totalDuration: a.duration,
  }
  return appointmentsApi.create(input)
}
```

> Pro agendamento, os dropdowns de cliente/profissional/serviço devem usar os
> **IDs reais** vindos de `clientsApi.list()`, `professionalsApi.list()` e
> `servicesApi.list()` — não os IDs locais mockados.

---

## 5. ⚠️ Diferenças de formato (local → API) — precisa de adaptador

| Campo | App (local) | API (NestJS) |
|---|---|---|
| Tipo de lançamento | `'IN'` / `'OUT'` | `'INCOME'` / `'EXPENSE'` |
| Método de pgto | `'Dinheiro'`/`'Cartão'`/`'PIX'`/`'Outro'` | `'CASH'`/`'CREDIT_CARD'`/`'DEBIT_CARD'`/`'PIX'`/`'TRANSFER'`/`'OTHER'` |
| Datas/horas | `'dd/MM'` + `'HH:mm'` | **ISO 8601** (`startTime`, `endTime`, `date`) |
| Agendamento | `clienteId`, `servicoIds`, `price`, `duration` | `clientId`, `serviceIds`, `totalPrice`, `totalDuration`, `startTime`, `endTime` |
| Cliente (criar) | manda tudo | só `name`, `phone`, `email?`, `birthdate?`, `gender?`, `notes?` |
| Cliente (ler) | `visits`/`spent`/`lastVisit` | `totalVisits`/`totalSpent`/`lastVisit` |
| Status agend. | já usa `SCHEDULED`… | `SCHEDULED`/`CONFIRMED`/`IN_PROGRESS`/`COMPLETED`/`CANCELED`/`NO_SHOW` |

---

## 6. Endpoints disponíveis (referência — `api.ts` já encapsula)

Base: `https://api.stylogestor.com.br/api/v1`, com `Bearer` + `x-tenant-slug`
(exceto os 2 primeiros):

- `GET /tenants/mine` · `POST /tenants` *(bootstrap/onboarding — sem x-tenant-slug)*
- `GET /tenants/me` · `GET /tenants/me/dashboard` · `PATCH /tenants/me`
- `GET/POST /clients` · `GET/PATCH /clients/:id` · `GET /clients/:id/history`
- `GET/POST /services` · `GET/PATCH/DELETE /services/:id` ·
  `GET /services?includeInactive=true` (gestor: lista ativos+inativos)
- `GET/POST /professionals` · `GET/PATCH/DELETE /professionals/:id` ·
  `GET /professionals?includeInactive=true`
- `GET/POST /appointments` · `GET/PATCH/DELETE /appointments/:id` ·
  `PATCH /appointments/:id/status` · `GET /appointments/availability`
- `GET /financial/cashflow` · `GET /financial/transactions` ·
  `GET /financial/reports/daily` · `POST /financial/transactions`

> **Ligar/desligar serviço ou profissional:** `PATCH /services/:id` ou
> `PATCH /professionals/:id` com `{ "active": false }` (ou `true` pra reativar).
> O `api.ts` tem atalho: `servicesApi.setActive(id, false)` /
> `professionalsApi.setActive(id, true)`. `DELETE` faz soft-delete (active:false).
> Por padrão `list()` só traz ativos; `list(true)` traz inativos também.

### Shape da resposta de `/appointments` (pras telas de agenda)

`GET /appointments` (lista) — cada item:
```jsonc
{
  "id": "uuid", "clientId": "uuid", "professionalId": "uuid",
  "date": "2026-05-28T00:00:00.000Z",
  "startTime": "2026-05-28T14:00:00.000Z",
  "endTime":   "2026-05-28T14:30:00.000Z",
  "status": "SCHEDULED",
  "totalPrice": 35, "totalDuration": 30,
  "notes": null, "source": "manual", "cancelReason": null,
  "client":       { "id": "uuid", "name": "Carlos" },          // só id+name na lista
  "professional": { "id": "uuid", "name": "João", "avatar": null },
  "services": [
    { "serviceId": "uuid", "price": 35, "duration": 30,
      "service": { "id": "uuid", "name": "Corte", "price": 35, "duration": 30 } }
  ]
}
```
`GET /appointments/:id` traz o mesmo, porém `client` e `professional` **completos**
+ array `payments`.

**Adaptador pro tipo local `Agendamento`:**
```ts
function fromApi(a: any): Agendamento {
  const start = new Date(a.startTime)
  return {
    id: a.id,
    clienteId: a.clientId,
    clienteNome: a.client?.name ?? '',
    profissionalId: a.professionalId,
    profissionalNome: a.professional?.name ?? '',
    servicoIds: (a.services ?? []).map((s: any) => s.serviceId),
    servicoNomes: (a.services ?? []).map((s: any) => s.service?.name).join(' + '),
    status: a.status,
    price: Number(a.totalPrice),
    duration: a.totalDuration,
    date: start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    time: start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    createdAt: a.createdAt,
  }
}
```
- Mudar status: `appointmentsApi.setStatus(id, 'COMPLETED')`.
- Listar do dia: `appointmentsApi.list({ date: '2026-05-28' })` (YYYY-MM-DD).

---

## 7. Tratamento de erro

Tudo lança `ApiError` com `.status`:
- **401** → sessão expirada → mandar pro login.
- **409** → onboarding pendente (bootstrap não rodou / sem barbearia) → onboarding.
- **403** → usuário não é membro do tenant.
- **400** → payload inválido (campo extra ou faltando).

```ts
import { ApiError } from '@/lib/api'
try { await clientsApi.create(...) }
catch (e) {
  if (e instanceof ApiError && e.status === 401) router.replace('/login')
  else Alert.alert('Erro', e instanceof ApiError ? e.message : 'Falha de rede')
}
```

---

## 8. Como testar / Definition of Done

1. **Login** → ver no log a chamada `GET /tenants/mine`.
2. **Conta nova** (sem barbearia) → cai no onboarding → `POST /tenants` → entra.
3. **Conta existente** → entra direto, dados vêm da API (não do SecureStore).
4. Criar **cliente / lançamento / agendamento** → sumir os SEEDs mockados;
   dado persiste após fechar/abrir o app.
5. **Bump do versionCode** + novo build EAS (sem env nova).

✅ **Pronto quando:** clientes, financeiro, serviços, profissionais e agendamentos
lendo/gravando na API; onboarding funcionando; logout limpando o tenant.

---

## 9. Observações finais

- Isso é **só o mobile-gestor**. O **mobile-cliente** terá trabalho análogo, mas
  consome as rotas **públicas** de agendamento (`/api/v1/booking/:slug/*`), não as
  scoped do gestor.
- Dúvidas de API / IDs / formatos → falar com o **time Backend** (consegue
  verificar no banco em produção na hora).
