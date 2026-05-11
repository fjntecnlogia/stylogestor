'use client'

import { useState } from 'react'
import { UserButton, Show } from '@clerk/nextjs'
import { AppointmentModal } from '../agenda/appointment-modal'

export function Topbar() {
  const [agendamentoOpen, setAgendamentoOpen] = useState(false)

  const now = new Date()
  const date = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <header className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 shrink-0 shadow-sm">
        <p className="text-sm text-[#6B7280] font-medium capitalize">{date}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAgendamentoOpen(true)}
            className="bg-[#1A3A6B] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#142d55] transition-colors shadow-sm"
          >
            + Novo agendamento
          </button>
          <Show when="signed-in">
            <UserButton
              afterSignOutUrl="/login"
              appearance={{ elements: { avatarBox: 'w-8 h-8' } }}
            />
          </Show>
        </div>
      </header>

      <AppointmentModal
        open={agendamentoOpen}
        onClose={() => setAgendamentoOpen(false)}
        defaultDate=""
      />
    </>
  )
}
