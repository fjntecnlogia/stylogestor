import { ConfiguracoesView } from '@/components/configuracoes/configuracoes-view'

export const metadata = { title: 'Configurações — STYLOGESTOR' }

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1C2E] font-sora">⚙️ Configurações</h1>
        <p className="text-[#4A4A5A] text-sm mt-1">Configure sua barbearia, horários e plano de assinatura.</p>
      </div>
      <ConfiguracoesView />
    </div>
  )
}
