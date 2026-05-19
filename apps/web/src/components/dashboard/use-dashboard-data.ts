'use client'

import { useEffect, useState, useCallback } from 'react'

export interface DashboardApt {
  id: string
  clientName: string
  clientPhone: string
  professionalName: string
  services: string
  time: string
  totalPrice: number
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'
}

export interface DashboardPayment {
  id: string
  client: string
  service: string
  amount: number
  method: string
  paidAt: string
}

export interface DashboardKpis {
  agendamentosHoje: number
  agendamentosMes: number
  totalClientes: number
  novosClientesMes: number
  receitaMes: number
  despesaMes: number
  lucroMes: number
  totalHoje: number
  ticketMedio: number
  completedHoje: number
  pendentesHoje: number
}

export interface DashboardData {
  agendamentosHoje: DashboardApt[]
  paymentsHoje: DashboardPayment[]
  kpis: DashboardKpis
  alerts: Array<{ type: string; msg: string }>
}

const EMPTY: DashboardData = {
  agendamentosHoje: [],
  paymentsHoje: [],
  kpis: {
    agendamentosHoje: 0, agendamentosMes: 0, totalClientes: 0,
    novosClientesMes: 0, receitaMes: 0, despesaMes: 0, lucroMes: 0,
    totalHoje: 0, ticketMedio: 0, completedHoje: 0, pendentesHoje: 0,
  },
  alerts: [],
}

/**
 * Hook compartilhado pelos 3 cards do dashboard (stats-grid,
 * appointments-today, cashflow-card). Faz UMA chamada à API
 * /api/reports/dashboard e distribui o resultado.
 *
 * Expose `refresh()` pra re-fetch quando ações mudam o estado
 * (ex: gestor conclui um atendimento → KPIs precisam atualizar).
 */
export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(EMPTY)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/reports/dashboard')
      if (!res.ok) return
      const json = await res.json()
      setData({
        agendamentosHoje: json.agendamentosHoje ?? [],
        paymentsHoje: json.paymentsHoje ?? [],
        kpis: { ...EMPTY.kpis, ...(json.kpis ?? {}) },
        alerts: json.alerts ?? [],
      })
    } catch (err) {
      console.warn('[dashboard] fetch falhou', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, refresh: fetchData }
}
