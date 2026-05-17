'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

interface Props {
  open: boolean
  onClose: () => void
  onSave?: (client: { name: string; phone: string; email: string; notes: string }) => void
}

export function NovoClienteModal({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!name || !phone) return
    onSave?.({ name, phone, email, notes })
    setName('')
    setPhone('')
    setEmail('')
    setNotes('')
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-[#1A3A6B] px-6 py-4">
            <Dialog.Title className="text-white font-sora font-bold text-lg">
              👥 Novo Cliente
            </Dialog.Title>
            <p className="text-white/60 text-sm mt-0.5">Cadastre um novo cliente</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#111827] block mb-1.5">
                Nome completo *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2.5 text-sm text-[#111827] font-medium placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-[#111827] block mb-1.5">
                WhatsApp *
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2.5 text-sm text-[#111827] font-medium placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-[#111827] block mb-1.5">
                E-mail
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                type="email"
                className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2.5 text-sm text-[#111827] font-medium placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-[#111827] block mb-1.5">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferências, alergias, etc..."
                rows={3}
                className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2.5 text-sm text-[#111827] font-medium placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] resize-none"
              />
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border-2 border-[#E5E7EB] text-[#374151] font-semibold py-2.5 rounded-xl hover:bg-[#F9FAFB] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!name || !phone}
              className="flex-1 bg-[#1A3A6B] disabled:opacity-40 text-white font-bold py-2.5 rounded-xl hover:bg-[#142d55] transition-colors"
            >
              ✓ Cadastrar cliente
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
