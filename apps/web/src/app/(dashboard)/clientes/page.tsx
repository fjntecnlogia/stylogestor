import { ClientesView } from '@/components/clientes/clientes-view'

export const metadata = { title: 'Clientes — STYLOGESTOR' }

export default function ClientesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1C2E] font-sora">👥 Clientes</h1>
        <p className="text-[#4A4A5A] text-sm mt-1">Gerencie seus clientes e veja o histórico de atendimentos.</p>
      </div>
      <ClientesView />
    </div>
  )
}
