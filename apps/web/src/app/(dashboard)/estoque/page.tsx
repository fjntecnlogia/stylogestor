import { EstoqueView } from '@/components/estoque/estoque-view'

export const metadata = { title: 'Estoque — STYLOGESTOR' }

export default function EstoquePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1C2E] font-sora">📦 Estoque</h1>
        <p className="text-[#4A4A5A] text-sm mt-1">Controle seus produtos e receba alertas de estoque baixo.</p>
      </div>
      <EstoqueView />
    </div>
  )
}
