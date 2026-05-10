import { StatsGrid } from '@/components/dashboard/stats-grid'
import { AppointmentsToday } from '@/components/dashboard/appointments-today'
import { CashflowCard } from '@/components/dashboard/cashflow-card'

export const metadata = { title: 'Dashboard — STYLOGESTOR' }

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1C2E] font-sora">Bom dia! ✂️</h1>
        <p className="text-[#4A4A5A] text-sm mt-1">Aqui está o resumo do seu negócio hoje.</p>
      </div>

      <StatsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentsToday />
        <CashflowCard />
      </div>
    </div>
  )
}
