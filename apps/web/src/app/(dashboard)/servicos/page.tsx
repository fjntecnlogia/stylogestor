import { ServicosView } from '@/components/servicos/servicos-view'

export const metadata = { title: 'Serviços — STYLOGESTOR' }

export default function ServicosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1C2E] font-sora">📋 Serviços</h1>
        <p className="text-[#4A4A5A] text-sm mt-1">Configure os serviços, preços e durações.</p>
      </div>
      <ServicosView />
    </div>
  )
}
