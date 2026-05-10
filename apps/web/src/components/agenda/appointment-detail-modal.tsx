'use client'

import * as Dialog from '@radix-ui/react-dialog'
import type { EventImpl } from '@fullcalendar/core/internal'

interface Props {
  open: boolean
  onClose: () => void
  event: EventImpl | null
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmado', cls: 'bg-[#1B8A5A]/10 text-[#1B8A5A]' },
  pending:   { label: 'Aguardando', cls: 'bg-[#F5A623]/10 text-[#b07a10]' },
  completed: { label: 'Concluído',  cls: 'bg-[#1A3A6B]/10 text-[#1A3A6B]' },
  canceled:  { label: 'Cancelado',  cls: 'bg-red-100 text-red-600' },
}

export function AppointmentDetailModal({ open, onClose, event }: Props) {
  if (!event) return null

  const ext = event.extendedProps
  const status = STATUS_MAP[ext.status] ?? STATUS_MAP.pending

  const start = event.start
    ? event.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '--'
  const end = event.end
    ? event.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '--'
  const date = event.start
    ? event.start.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '--'

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

          <div className="bg-[#1A3A6B] px-6 py-4">
            <Dialog.Title className="text-white font-sora font-bold text-lg">
              Detalhes do Agendamento
            </Dialog.Title>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-[#4A4A5A]">Cliente</p>
                <p className="font-semibold text-[#1C1C2E] text-lg">{ext.client}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.cls}`}>
                {status.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#F8F6F2] rounded-xl p-4">
              <div>
                <p className="text-xs text-[#4A4A5A]">Data</p>
                <p className="text-sm font-medium text-[#1C1C2E] capitalize">{date}</p>
              </div>
              <div>
                <p className="text-xs text-[#4A4A5A]">Horário</p>
                <p className="text-sm font-medium text-[#1C1C2E]">{start} – {end}</p>
              </div>
              <div>
                <p className="text-xs text-[#4A4A5A]">Profissional</p>
                <p className="text-sm font-medium text-[#1C1C2E]">{ext.professional}</p>
              </div>
              <div>
                <p className="text-xs text-[#4A4A5A]">Valor</p>
                <p className="text-sm font-bold text-[#1B8A5A]">R$ {ext.price}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-[#4A4A5A] mb-1">Serviço</p>
              <p className="text-sm font-medium text-[#1C1C2E] bg-[#F8F6F2] px-3 py-2 rounded-lg">
                ✂️ {ext.service}
              </p>
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            {ext.status !== 'completed' && ext.status !== 'canceled' && (
              <button className="flex-1 bg-[#1B8A5A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#156b47] transition-colors">
                ✓ Concluir
              </button>
            )}
            {ext.status !== 'canceled' && ext.status !== 'completed' && (
              <button className="flex-1 border border-red-200 text-red-500 text-sm font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors">
                Cancelar
              </button>
            )}
            <button onClick={onClose} className="px-4 text-sm text-[#4A4A5A] hover:text-[#1C1C2E]">
              Fechar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
