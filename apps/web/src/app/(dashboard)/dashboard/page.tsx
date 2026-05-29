'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/lib/use-user'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { AppointmentsToday } from '@/components/dashboard/appointments-today'
import { CashflowCard } from '@/components/dashboard/cashflow-card'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { DashboardTour } from '@/components/dashboard/dashboard-tour'
import { TrialCard } from '@/components/dashboard/trial-card'

export default function DashboardPage() {
  const { user } = useUser()
  const [tenantName, setTenantName] = useState('')

  // Nome da barbearia vem da API (não do app_metadata) — a saudação funciona
  // mesmo que o backend ainda não tenha populado o metadata.
  useEffect(() => {
    fetch('/api/me/tenant')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.name) setTenantName(d.name) })
      .catch(() => {})
  }, [])

  const userName = (user?.user_metadata as { name?: string } | undefined)?.name
  const displayName = tenantName || userName || 'Gestor'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-5">
      <div
        data-tour="greeting"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl"
      >
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C2E] font-sora">
            {greeting}, {displayName}! ✂️
          </h1>
          <p className="text-[#4A4A5A] text-sm mt-1">
            Aqui está o resumo do seu negócio hoje.
          </p>
        </div>
        <div data-tour="quick-actions">
          <QuickActions />
        </div>
      </div>

      {/* Trial info — só aparece se for trial/expirado/cancelado (assinante pago não vê) */}
      <TrialCard />

      <div data-tour="stats">
        <StatsGrid />
      </div>
      <AlertsPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div data-tour="appointments">
          <AppointmentsToday />
        </div>
        <div data-tour="cashflow">
          <CashflowCard />
        </div>
      </div>

      <DashboardTour />
    </div>
  )
}
