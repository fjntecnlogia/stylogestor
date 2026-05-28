// Cliente HTTP autenticado da API NestJS (api.stylogestor.com.br).
//
// Fase 1 da unificação de identidade (ver docs/AUTH_UNIFICATION.md):
// o app passa a consumir a NestJS usando o JWT do Supabase + o header
// `x-tenant-slug` (slug da barbearia resolvido no bootstrap — ver lib/tenant.ts).
//
// Toda request:
//   Authorization: Bearer <access_token do supabase.auth.getSession()>
//   x-tenant-slug:  <slug da barbearia ativa>  (exceto rotas de bootstrap)

import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'
import { supabase } from './supabase'

const BASE_URL =
  (Constants.expoConfig?.extra?.nestApiUrl as string | undefined) ||
  'https://api.stylogestor.com.br'
const API_PREFIX = '/api/v1'

const TENANT_SLUG_KEY = 'active_tenant_slug'

// ── Barbearia ativa (cache em memória + SecureStore) ──────────────
// O slug é setado no bootstrap/onboarding (lib/tenant.ts) e usado como
// header `x-tenant-slug` em todas as rotas tenant-scoped.
let activeTenantSlug: string | null = null

export function getActiveTenantSlug(): string | null {
  return activeTenantSlug
}

export async function setActiveTenantSlug(slug: string | null): Promise<void> {
  activeTenantSlug = slug
  try {
    if (slug) await SecureStore.setItemAsync(TENANT_SLUG_KEY, slug)
    else await SecureStore.deleteItemAsync(TENANT_SLUG_KEY)
  } catch (err) {
    console.warn('[api] falha ao persistir tenant slug:', err)
  }
}

/** Carrega o slug persistido pro cache em memória. Chamar 1x no boot do app. */
export async function loadActiveTenantSlug(): Promise<string | null> {
  try {
    activeTenantSlug = (await SecureStore.getItemAsync(TENANT_SLUG_KEY)) ?? null
  } catch {
    activeTenantSlug = null
  }
  return activeTenantSlug
}

// ── Erro tipado ───────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

// ── Fetch base autenticado ────────────────────────────────────────
type FetchOpts = Omit<RequestInit, 'body'> & {
  body?: unknown
  /** Rotas tenant-scoped exigem `x-tenant-slug`. Default: true. */
  tenantScoped?: boolean
}

async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { body, tenantScoped = true, headers, ...rest } = opts

  // JWT da sessão Supabase corrente (auto-refresh já é tratado pelo client).
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new ApiError(401, 'Sessão expirada. Faça login novamente.')

  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(headers as Record<string, string> | undefined),
  }

  if (tenantScoped) {
    if (!activeTenantSlug) {
      throw new ApiError(
        409,
        'Nenhuma barbearia selecionada (onboarding pendente).',
      )
    }
    h['x-tenant-slug'] = activeTenantSlug
  }

  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    ...rest,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const json = text ? safeJson(text) : undefined

  if (!res.ok) {
    const msg =
      json && typeof json === 'object' && 'message' in json
        ? Array.isArray((json as { message: unknown }).message)
          ? ((json as { message: string[] }).message).join(', ')
          : String((json as { message: unknown }).message)
        : `HTTP ${res.status}`
    throw new ApiError(res.status, msg, json)
  }

  return json as T
}

// ============================================================
// TIPOS (espelham os enums/DTOs da API NestJS)
// ============================================================

export type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'PREMIUM'

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW'

export type TransactionType = 'INCOME' | 'EXPENSE'

export type PaymentMethod =
  | 'CASH'
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'TRANSFER'
  | 'OTHER'

export type Membership = {
  id: string
  slug: string
  name: string
  logo: string | null
  plan: PlanType
  role: string
}

export type CreateTenantInput = {
  name: string
  type?: string
  phone?: string
  city?: string
  plan?: PlanType
  schedules?: { day: number; start: string; end: string; active?: boolean }[]
  professionals?: { name: string; role?: string; commission?: number }[]
  services?: { name: string; price: number; duration: number }[]
}

export type CreateAppointmentInput = {
  clientId: string
  professionalId: string
  startTime: string // ISO 8601
  endTime: string // ISO 8601
  serviceIds: string[]
  totalPrice: number
  totalDuration: number
  notes?: string
  source?: string
}

export type CreateClientInput = {
  name: string
  phone: string
  email?: string
  birthdate?: string // ISO date
  gender?: string
  notes?: string
  source?: string
}

export type CreateTransactionInput = {
  type: TransactionType
  category: string
  description: string
  amount: number
  date: string // ISO date
  paymentMethod?: PaymentMethod
  notes?: string
}

export type CreateServiceInput = {
  name: string
  price: number
  duration: number // minutos
  description?: string
  category?: string
  color?: string
  image?: string
}

// Os tipos de RESPOSTA das rotas de CRUD (appointment/client/transaction) são
// genéricos de propósito: o time Mobile refina conforme for ligando cada tela
// (a forma exata vem do service layer da API). Use `as` ou defina interfaces
// locais quando consumir.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiObject = Record<string, any>

// ============================================================
// CLIENTES DE RECURSO
// ============================================================

/** Bootstrap & onboarding — NÃO precisam de x-tenant-slug. */
export const tenantsApi = {
  /** Lista as barbearias do usuário logado. [] = precisa de onboarding. */
  mine: () => apiFetch<Membership[]>('/tenants/mine', { tenantScoped: false }),

  /** Onboarding: cria a barbearia + vincula o usuário como owner. */
  create: (input: CreateTenantInput) =>
    apiFetch<{ ok: true; tenant: { id: string; slug: string; name: string } }>(
      '/tenants',
      { method: 'POST', body: input, tenantScoped: false },
    ),

  /** Dados completos da barbearia ativa (requer x-tenant-slug). */
  me: () => apiFetch<ApiObject>('/tenants/me'),

  /** KPIs do dashboard da barbearia ativa. */
  dashboard: () => apiFetch<ApiObject>('/tenants/me/dashboard'),

  /** Atualiza dados da barbearia ativa. */
  update: (patch: ApiObject) =>
    apiFetch<ApiObject>('/tenants/me', { method: 'PATCH', body: patch }),
}

export const appointmentsApi = {
  list: (params?: { date?: string; professionalId?: string; status?: string }) => {
    const qs = new URLSearchParams()
    if (params?.date) qs.set('date', params.date)
    if (params?.professionalId) qs.set('professionalId', params.professionalId)
    if (params?.status) qs.set('status', params.status)
    const q = qs.toString()
    return apiFetch<ApiObject[]>(`/appointments${q ? `?${q}` : ''}`)
  },

  availability: (date: string, professionalId: string, serviceIds?: string[]) => {
    const qs = new URLSearchParams({ date, professionalId })
    if (serviceIds?.length) qs.set('serviceIds', serviceIds.join(','))
    return apiFetch<ApiObject>(`/appointments/availability?${qs.toString()}`)
  },

  get: (id: string) => apiFetch<ApiObject>(`/appointments/${id}`),

  create: (input: CreateAppointmentInput) =>
    apiFetch<ApiObject>('/appointments', { method: 'POST', body: input }),

  update: (id: string, patch: Partial<CreateAppointmentInput>) =>
    apiFetch<ApiObject>(`/appointments/${id}`, { method: 'PATCH', body: patch }),

  setStatus: (id: string, status: AppointmentStatus, cancelReason?: string) =>
    apiFetch<ApiObject>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: { status, cancelReason },
    }),

  remove: (id: string) =>
    apiFetch<void>(`/appointments/${id}`, { method: 'DELETE' }),
}

export const clientsApi = {
  list: (search?: string) =>
    apiFetch<ApiObject[]>(
      `/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    ),

  get: (id: string) => apiFetch<ApiObject>(`/clients/${id}`),

  history: (id: string) => apiFetch<ApiObject[]>(`/clients/${id}/history`),

  create: (input: CreateClientInput) =>
    apiFetch<ApiObject>('/clients', { method: 'POST', body: input }),

  update: (id: string, patch: Partial<CreateClientInput>) =>
    apiFetch<ApiObject>(`/clients/${id}`, { method: 'PATCH', body: patch }),
}

export const professionalsApi = {
  list: () => apiFetch<ApiObject[]>('/professionals'),
  get: (id: string) => apiFetch<ApiObject>(`/professionals/${id}`),
  create: (input: ApiObject) =>
    apiFetch<ApiObject>('/professionals', { method: 'POST', body: input }),
  update: (id: string, patch: ApiObject) =>
    apiFetch<ApiObject>(`/professionals/${id}`, { method: 'PATCH', body: patch }),
}

export const servicesApi = {
  list: () => apiFetch<ApiObject[]>('/services'),
  get: (id: string) => apiFetch<ApiObject>(`/services/${id}`),
  create: (input: CreateServiceInput) =>
    apiFetch<ApiObject>('/services', { method: 'POST', body: input }),
  update: (id: string, patch: Partial<CreateServiceInput>) =>
    apiFetch<ApiObject>(`/services/${id}`, { method: 'PATCH', body: patch }),
  remove: (id: string) => apiFetch<void>(`/services/${id}`, { method: 'DELETE' }),
}

export const financialApi = {
  cashflow: (month: string) =>
    apiFetch<ApiObject>(`/financial/cashflow?month=${encodeURIComponent(month)}`),

  transactions: (from: string, to: string) =>
    apiFetch<ApiObject[]>(
      `/financial/transactions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),

  dailyReport: (date: string) =>
    apiFetch<ApiObject>(`/financial/reports/daily?date=${encodeURIComponent(date)}`),

  createTransaction: (input: CreateTransactionInput) =>
    apiFetch<ApiObject>('/financial/transactions', {
      method: 'POST',
      body: input,
    }),
}

// Exporta o fetch base pra casos não cobertos pelos clients acima.
export { apiFetch }
