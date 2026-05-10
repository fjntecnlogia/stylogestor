import { AgendaView } from '@/components/agenda/agenda-view'

export const metadata = { title: 'Agenda — STYLOGESTOR' }

export default function AgendaPage() {
  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C2E] font-sora">📅 Agenda</h1>
          <p className="text-[#4A4A5A] text-sm mt-1">Gerencie todos os agendamentos do seu negócio.</p>
        </div>
      </div>
      <AgendaView />
    </div>
  )
}
