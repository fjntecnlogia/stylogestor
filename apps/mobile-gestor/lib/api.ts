import Constants from 'expo-constants'

const API_URL = (Constants.expoConfig?.extra?.apiUrl as string) || 'https://app.stylogestor.com.br'

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── Dashboard ─────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => fetcher<{
    agendamentosHoje: Array<{
      id: string; clientName: string; professionalName: string
      services: string; time: string; totalPrice: number; status: string
    }>
    kpis: {
      agendamentosHoje: number; agendamentosMes: number
      totalClientes: number; novosClientesMes: number
      receitaMes: number; despesaMes: number; lucroMes: number
    }
    alerts: Array<{ type: string; msg: string }>
  }>('/api/reports/dashboard'),
}

// ── Financeiro ────────────────────────────────────────────────────
export const financeiroApi = {
  get: (periodo = 'hoje') => fetcher<{
    transactions: Array<{
      id: string; type: string; desc: string; cat: string
      method: string; amount: number; date: string; time: string
    }>
    summary: { income: number; expense: number; balance: number }
  }>(`/api/reports/financeiro?periodo=${periodo}`),
}

// ── WhatsApp ──────────────────────────────────────────────────────
export const whatsappApi = {
  sendMessage: (phone: string, message: string) =>
    fetcher('/api/automations/appointment', {
      method: 'POST',
      body: JSON.stringify({ type: 'custom', phone, message }),
    }),
}
