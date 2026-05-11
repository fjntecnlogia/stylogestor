import { PlanosView } from '@/components/planos/planos-view'

export const metadata = { title: 'Planos e Assinatura — STYLOGESTOR' }

export default function PlanosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] font-sora">💳 Planos e Assinatura</h1>
        <p className="text-[#6B7280] text-sm mt-1 font-medium">
          Gerencie sua assinatura e histórico de pagamentos.
        </p>
      </div>
      <PlanosView />
    </div>
  )
}
