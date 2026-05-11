import { ProgramaFidelidadeView } from '@/components/fidelidade/programa-fidelidade-view'

export const metadata = { title: 'Programa de Fidelidade — STYLOGESTOR' }

export default function FidelidadePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] font-sora">⭐ Programa de Fidelidade</h1>
        <p className="text-[#6B7280] text-sm mt-1 font-medium">
          Retenha clientes com recompensas automáticas. Cada visita conta!
        </p>
      </div>
      <ProgramaFidelidadeView />
    </div>
  )
}
