'use client'

import { useUser } from '@clerk/nextjs'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { AppointmentsToday } from '@/components/dashboard/appointments-today'
import { CashflowCard } from '@/components/dashboard/cashflow-card'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default function DashboardPage() {
  const { user } = useUser()
  const tenantName = (user?.publicMetadata as { tenantName?: string } | undefined)?.tenantName
  const displayName = tenantName || user?.firstName || 'Gestor'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C2E] font-sora">
            {greeting}, {displayName}! ✂️
          </h1>
          <p className="text-[#4A4A5A] text-sm mt-1">
            Aqui está o resumo do seu negócio hoje.
          </p>
        </div>
        <QuickActions />
      </div>

      <StatsGrid />
      <AlertsPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AppointmentsToday />
        <CashflowCard />
      </div>
    </div>
  )
}
