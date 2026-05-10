import { ProfissionaisView } from '@/components/profissionais/profissionais-view'

export const metadata = { title: 'Profissionais — STYLOGESTOR' }

export default function ProfissionaisPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1C2E] font-sora">✂️ Profissionais</h1>
        <p className="text-[#4A4A5A] text-sm mt-1">Gerencie sua equipe, horários e comissões.</p>
      </div>
      <ProfissionaisView />
    </div>
  )
}
