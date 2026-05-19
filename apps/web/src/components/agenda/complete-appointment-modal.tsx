'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useToast } from '@/components/ui/toast'

export interface AppointmentToComplete {
  id: string
  client: string
  service: string
  price: number
  start?: string
  time?: string
}

interface Props {
  appointment: AppointmentToComplete | null
  onClose: () => void
  onSuccess?: () => void
}

const PAYMENT_METHODS = [
  { value: 'PIX',         label: 'PIX',         icon: '🔷', color: '#1B8A5A' },
  { value: 'CASH',        label: 'Dinheiro',    icon: '💵', color: '#F5A623' },
  { value: 'CREDIT_CARD', label: 'Crédito',     icon: '💳', color: '#1A3A6B' },
  { value: 'DEBIT_CARD',  label: 'Débito',      icon: '💳', color: '#7C3AED' },
  { value: 'TRANSFER',    label: 'Transferência', icon: '🏦', color: '#06B6D4' },
  { value: 'OTHER',       label: 'Outros',      icon: '💰', color: '#9CA3AF' },
] as const

/**
 * Modal pra concluir agendamento — força gestor a escolher forma
 * de pagamento. Antes era hardcoded PIX, agora cada atendimento
 * sai com o método real, e o financeiro/dashboard refletem isso.
 */
export function CompleteAppointmentModal({ appointment, onClose, onSuccess }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { success, error } = useToast()

  // Reset ao trocar de appointment
  useEffect(() => {
    if (appointment) {
      setSelectedMethod(null)
      setSaving(false)
    }
  }, [appointment])

  const open = !!appointment

  const handleConfirm = async () => {
    if (!appointment || !selectedMethod) return
    setSaving(true)
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', payMethod: selectedMethod }),
      })
      const data = await res.json()
      if (!res.ok) {
        error(data.error || 'Erro ao concluir')
        return
      }
      success(`Atendimento concluído via ${PAYMENT_METHODS.find((m) => m.value === selectedMethod)?.label} ✓`)
      onSuccess?.()
      onClose()
    } catch (err) {
      error('Erro de conexão')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-[#1B8A5A] px-6 py-4">
            <Dialog.Title className="text-white font-sora font-bold text-lg">
              ✓ Concluir atendimento
            </Dialog.Title>
            <p className="text-white/70 text-xs mt-0.5">Como o cliente pagou?</p>
          </div>

          {appointment && (
            <>
              {/* Info do atendimento */}
              <div className="px-6 py-4 bg-[#F8F6F2] border-b border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1C1C2E] truncate">{appointment.client}</p>
                    <p className="text-xs text-[#6B7280] truncate">
                      {appointment.service}
                      {(appointment.start || appointment.time) && (
                        <> · {appointment.start ?? appointment.time}</>
                      )}
                    </p>
                  </div>
                  <p className="font-sora font-bold text-xl text-[#1B8A5A] shrink-0">
                    R$ {appointment.price}
                  </p>
                </div>
              </div>

              {/* Grid de métodos */}
              <div className="p-6">
                <p className="text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide mb-3">
                  Forma de pagamento
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const isSelected = selectedMethod === m.value
                    return (
                      <button
                        key={m.value}
                        onClick={() => setSelectedMethod(m.value)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-[#1B8A5A] bg-[#ECFDF5]'
                            : 'border-[#E5E7EB] hover:border-[#1B8A5A]/40 bg-white'
                        }`}
                      >
                        <span className="text-2xl">{m.icon}</span>
                        <span className={`font-semibold text-sm ${isSelected ? 'text-[#065F46]' : 'text-[#1C1C2E]'}`}>
                          {m.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 border-2 border-[#E5E7EB] text-[#374151] font-semibold py-2.5 rounded-xl hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedMethod || saving}
                  className="flex-1 bg-[#1B8A5A] disabled:opacity-40 text-white font-bold py-2.5 rounded-xl hover:bg-[#156b47] transition-colors"
                >
                  {saving ? 'Salvando...' : '✓ Confirmar pagamento'}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
