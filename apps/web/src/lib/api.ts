/**
 * API Client do STYLOGESTOR
 * Centraliza todas as chamadas à API NestJS.
 * Em desenvolvimento: usa mocks. Em produção: chama a API real.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erro desconhecido' }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }

  return res.json()
}

// ── Tenants ──────────────────────────────────────────────────
export const tenantsApi = {
  getMe: () => fetcher('/tenants/me'),
  getDashboard: () => fetcher('/tenants/me/dashboard'),
  update: (data: Record<string, unknown>) =>
    fetcher('/tenants/me', { method: 'PATCH', body: JSON.stringify(data) }),
}

// ── Agendamentos ─────────────────────────────────────────────
export const appointmentsApi = {
  list: (params?: { date?: string; professionalId?: string; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return fetcher(`/appointments${qs ? `?${qs}` : ''}`)
  },
  get: (id: string) => fetcher(`/appointments/${id}`),
  create: (data: Record<string, unknown>) =>
    fetcher('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string, cancelReason?: string) =>
    fetcher(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancelReason }),
    }),
  getAvailability: (date: string, professionalId: string) =>
    fetcher(`/appointments/availability?date=${date}&professionalId=${professionalId}`),
}

// ── Clientes ─────────────────────────────────────────────────
export const clientsApi = {
  list: (search?: string) => fetcher(`/clients${search ? `?search=${search}` : ''}`),
  get: (id: string) => fetcher(`/clients/${id}`),
  getHistory: (id: string) => fetcher(`/clients/${id}/history`),
  create: (data: Record<string, unknown>) =>
    fetcher('/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetcher(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// ── Profissionais ─────────────────────────────────────────────
export const professionalsApi = {
  list: () => fetcher('/professionals'),
  get: (id: string) => fetcher(`/professionals/${id}`),
  create: (data: Record<string, unknown>) =>
    fetcher('/professionals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetcher(`/professionals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// ── Financeiro ────────────────────────────────────────────────
export const financialApi = {
  getCashflow: (month?: string) => fetcher(`/financial/cashflow${month ? `?month=${month}` : ''}`),
  getTransactions: (from: string, to: string) =>
    fetcher(`/financial/transactions?from=${from}&to=${to}`),
  getDailyReport: (date?: string) =>
    fetcher(`/financial/reports/daily${date ? `?date=${date}` : ''}`),
  createTransaction: (data: Record<string, unknown>) =>
    fetcher('/financial/transactions', { method: 'POST', body: JSON.stringify(data) }),
}

// ── Assinaturas ───────────────────────────────────────────────
export const subscriptionsApi = {
  getPlans: () => fetcher('/subscriptions/plans'),
  getCurrent: () => fetcher('/subscriptions/current'),
}
