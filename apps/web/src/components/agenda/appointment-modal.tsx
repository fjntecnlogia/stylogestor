'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const MOCK_CLIENTS = [
  { id: '1', name: 'Carlos Oliveira', phone: '(11) 99999-0001' },
  { id: '2', name: 'Rafael Santos',   phone: '(11) 99999-0002' },
  { id: '3', name: 'Pedro Alves',     phone: '(11) 99999-0003' },
]

const MOCK_SERVICES = [
  { id: '1', name: 'Corte masculino', price: 40, duration: 30 },
  { id: '2', name: 'Barba',           price: 30, duration: 30 },
  { id: '3', name: 'Corte + Barba',   price: 60, duration: 45 },
  { id: '4', name: 'Pigmentação',     price: 80, duration: 60 },
]

const MOCK_PROFESSIONALS = [
  { id: '1', name: 'João Silva' },
  { id: '2', name: 'Pedro Costa' },
]

interface Props {
  open: boolean
  onClose: () => void
  defaultDate?: string
}

export function AppointmentModal({ open, onClose, defaultDate }: Props) {
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<typeof MOCK_CLIENTS[0] | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [professional, setProfessional] = useState('')
  const [date, setDate] = useState(defaultDate || new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('09:00')
  const [step, setStep] = useState<'client' | 'services' | 'schedule'>('client')

  const filteredClients = MOCK_CLIENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
  )

  const totalPrice = MOCK_SERVICES.filter((s) => selectedServices.includes(s.id)).reduce(
    (sum, s) => sum + s.price, 0
  )
  const totalDuration = MOCK_SERVICES.filter((s) => selectedServices.includes(s.id)).reduce(
    (sum, s) => sum + s.duration, 0
  )

  const handleClose = () => {
    setStep('client')
    setSelectedClient(null)
    setSelectedServices([])
    setClientSearch('')
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-0 overflow-hidden">

          {/* Header */}
          <div className="bg-[#1A3A6B] px-6 py-4">
            <Dialog.Title className="text-white font-sora font-bold text-lg">
              ✂️ Novo Agendamento
            </Dialog.Title>
            <p className="text-white/60 text-sm mt-0.5">
              {step === 'client' && 'Passo 1 de 3 — Selecionar cliente'}
              {step === 'services' && 'Passo 2 de 3 — Selecionar serviços'}
              {step === 'schedule' && 'Passo 3 de 3 — Data, hora e profissional'}
            </p>
          </div>

          {/* Conteúdo por step */}
          <div className="p-6 min-h-[300px]">

            {/* STEP 1 — Cliente */}
            {step === 'client' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Buscar por nome ou telefone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full border border-[#E8E6E2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
                />
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClient(c)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        selectedClient?.id === c.id
                          ? 'border-[#1A3A6B] bg-[#1A3A6B]/5'
                          : 'border-[#E8E6E2] hover:border-[#1A3A6B]/30'
                      }`}
                    >
                      <p className="text-sm font-medium text-[#1C1C2E]">{c.name}</p>
                      <p className="text-xs text-[#4A4A5A]">{c.phone}</p>
                    </button>
                  ))}
                </div>
                <button className="text-sm text-[#1A3A6B] font-medium hover:underline">
                  + Cadastrar novo cliente
                </button>
              </div>
            )}

            {/* STEP 2 — Serviços */}
            {step === 'services' && (
              <div className="space-y-2">
                {MOCK_SERVICES.map((s) => {
                  const selected = selectedServices.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        setSelectedServices((prev) =>
                          selected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                        )
                      }
                      className={`w-full text-left px-4 py-3 rounded-xl border flex justify-between items-center transition-all ${
                        selected ? 'border-[#1A3A6B] bg-[#1A3A6B]/5' : 'border-[#E8E6E2] hover:border-[#1A3A6B]/30'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-[#1C1C2E]">{s.name}</p>
                        <p className="text-xs text-[#4A4A5A]">{s.duration} min</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#1A3A6B]">R$ {s.price}</p>
                        {selected && <span className="text-xs text-[#1B8A5A]">✓ selecionado</span>}
                      </div>
                    </button>
                  )
                })}
                {selectedServices.length > 0 && (
                  <div className="pt-3 border-t border-[#E8E6E2] flex justify-between text-sm">
                    <span className="text-[#4A4A5A]">Total: {totalDuration} min</span>
                    <span className="font-bold text-[#1A3A6B]">R$ {totalPrice}</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 — Data/Hora/Profissional */}
            {step === 'schedule' && (
              <div className="space-y-4">
                <div className="bg-[#F8F6F2] rounded-xl p-4 text-sm">
                  <p className="text-[#4A4A5A]">Cliente: <span className="font-medium text-[#1C1C2E]">{selectedClient?.name}</span></p>
                  <p className="text-[#4A4A5A]">Serviços: <span className="font-medium text-[#1C1C2E]">{selectedServices.length} selecionado(s) · R$ {totalPrice}</span></p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#4A4A5A] block mb-1">Data</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#4A4A5A] block mb-1">Horário</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A4A5A] block mb-1">Profissional</label>
                  <select
                    value={professional}
                    onChange={(e) => setProfessional(e.target.value)}
                    className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
                  >
                    <option value="">Selecionar profissional</option>
                    {MOCK_PROFESSIONALS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer com botões */}
          <div className="px-6 py-4 border-t border-[#E8E6E2] flex justify-between">
            <button
              onClick={step === 'client' ? handleClose : () => setStep(step === 'services' ? 'client' : 'services')}
              className="text-sm text-[#4A4A5A] font-medium hover:text-[#1C1C2E]"
            >
              {step === 'client' ? 'Cancelar' : '← Voltar'}
            </button>

            {step !== 'schedule' ? (
              <button
                onClick={() => setStep(step === 'client' ? 'services' : 'schedule')}
                disabled={step === 'client' ? !selectedClient : selectedServices.length === 0}
                className="bg-[#1A3A6B] disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#142d55] transition-colors"
              >
                Próximo →
              </button>
            ) : (
              <button
                disabled={!professional}
                onClick={() => {
                  alert('Agendamento criado! ✅\n(Integração com API em breve)')
                  handleClose()
                }}
                className="bg-[#1B8A5A] disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#156b47] transition-colors"
              >
                ✓ Confirmar agendamento
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
