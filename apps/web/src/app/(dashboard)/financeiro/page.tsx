import { FinanceiroView } from '@/components/financeiro/financeiro-view'

export const metadata = { title: 'Financeiro — STYLOGESTOR' }

export default function FinanceiroPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1C2E] font-sora">💰 Financeiro</h1>
        <p className="text-[#4A4A5A] text-sm mt-1">Controle total das suas entradas, saídas e fechamento de caixa.</p>
      </div>
      <FinanceiroView />
    </div>
  )
}
