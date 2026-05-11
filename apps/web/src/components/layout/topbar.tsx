'use client'

import { useState } from 'react'
import { UserButton, Show } from '@clerk/nextjs'
import { AppointmentModal } from '../agenda/appointment-modal'

interface Props {
  onMenuToggle?: () => void
}

export function Topbar({ onMenuToggle }: Props) {
  const [agendamentoOpen, setAgendamentoOpen] = useState(false)

  const now = new Date()
  const date = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <header className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Hamburger — apenas mobile */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors shrink-0"
            aria-label="Menu"
          >
            <span className="block w-4.5 h-0.5 bg-[#374151] rounded" />
            <span className="block w-4.5 h-0.5 bg-[#374151] rounded" />
            <span className="block w-4.5 h-0.5 bg-[#374151] rounded" />
          </button>
          <p className="text-sm text-[#6B7280] font-medium capitalize hidden sm:block">{date}</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setAgendamentoOpen(true)}
            className="bg-[#1A3A6B] text-white text-xs md:text-sm font-bold px-3 md:px-4 py-2 rounded-xl hover:bg-[#142d55] transition-colors shadow-sm whitespace-nowrap"
          >
            + <span className="hidden sm:inline">Novo </span>agendamento
          </button>
          <Show when="signed-in">
            <UserButton
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
