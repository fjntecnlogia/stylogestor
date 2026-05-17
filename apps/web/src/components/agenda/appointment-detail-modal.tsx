'use client'

import * as Dialog from '@radix-ui/react-dialog'

interface Appointment {
  id: string
  client: string
  service: string
  price: number
  discount: number
  payMethod: string
  status: string
  professionalId: string
  start: string
  end: string
  note?: string
  phone?: string
}

interface Props {
  open: boolean
  onClose: () => void
  appointment: Appointment | null
  professionalName?: string
  onConcluir?: (id: string) => void
  onCancelar?: (id: string) => void
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  CONFIRMED:   { label: 'Confirmado', cls: 'bg-[#1B8A5A]/10 text-[#1B8A5A]' },
  SCHEDULED:   { label: 'Aguardando', cls: 'bg-[#F5A623]/10 text-[#b07a10]' },
  IN_PROGRESS: { label: 'Em atend.',  cls: 'bg-[#FEE2E2] text-[#991B1B]' },
  COMPLETED:   { label: 'Concluído',  cls: 'bg-[#1A3A6B]/10 text-[#1A3A6B]' },
  CANCELED:    { label: 'Cancelado',  cls: 'bg-red-100 text-red-600' },
  NO_SHOW:     { label: 'Faltou',     cls: 'bg-[#FEF2F2] text-[#991B1B]' },
}

export function AppointmentDetailModal({
  open,
  onClose,
  appointment,
  professionalName,
  onConcluir,
  onCancelar,
}: Props) {
  if (!appointment) return null

  const status = STATUS_MAP[appointment.status] ?? STATUS_MAP.SCHEDULED
  const total = appointment.price - appointment.discount

  const handleConcluir = () => {
    onConcluir?.(appointment.id)
    onClose()
  }

  const handleCancelar = () => {
    if (!confirm('Cancelar este agendamento?')) return
    onCancelar?.(appointment.id)
    onClose()
  }

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
                <p className="font-semibold text-[#1C1C2E] text-lg">{appointment.client}</p>
                {appointment.phone && (
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{appointment.phone}</p>
                )}
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.cls}`}>
                {status.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#F8F6F2] rounded-xl p-4">
              <div>
                <p className="text-xs text-[#4A4A5A]">Horário</p>
                <p className="text-sm font-medium text-[#1C1C2E]">{appointment.start} – {appointment.end}</p>
              </div>
              <div>
                <p className="text-xs text-[#4A4A5A]">Profissional</p>
                <p className="text-sm font-medium text-[#1C1C2E]">{professionalName ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#4A4A5A]">Pagamento</p>
                <p className="text-sm font-medium text-[#1C1C2E]">{appointment.payMethod || 'Pendente'}</p>
              </div>
              <div>
                <p className="text-xs text-[#4A4A5A]">Valor</p>
                <p className="text-sm font-bold text-[#1B8A5A]">R$ {total}</p>
                {appointment.discount > 0 && (
                  <p className="text-[10px] text-red-500">-R$ {appointment.discount} desc.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-[#4A4A5A] mb-1">Serviço</p>
              <p className="text-sm font-medium text-[#1C1C2E] bg-[#F8F6F2] px-3 py-2 rounded-lg">
                ✂️ {appointment.service}
              </p>
            </div>

            {appointment.note && (
              <div>
                <p className="text-xs text-[#4A4A5A] mb-1">Observação</p>
                <p className="text-sm text-[#1C1C2E] bg-[#FEF9C3] px-3 py-2 rounded-lg italic">
                  💬 {appointment.note}
                </p>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 flex gap-3">
            {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELED' && (
              <button
                onClick={handleConcluir}
                className="flex-1 bg-[#1B8A5A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#156b47] transition-colors"
              >
                ✓ Concluir
              </button>
            )}
            {appointment.status !== 'CANCELED' && appointment.status !== 'COMPLETED' && (
              <button
                onClick={handleCancelar}
                className="flex-1 border border-red-200 text-red-500 text-sm font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors"
              >
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
