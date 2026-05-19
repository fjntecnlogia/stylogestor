'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, Show } from '@clerk/nextjs'
import { AppointmentModal, type NewAppointmentPayload } from '../agenda/appointment-modal'
import { TrialBadge } from './trial-badge'

interface Props {
  onMenuToggle?: () => void
}

export function Topbar({ onMenuToggle }: Props) {
  const router = useRouter()
  const [agendamentoOpen, setAgendamentoOpen] = useState(false)

  const now = new Date()
  const date = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  // onSave do topbar: faz POST real e redireciona pra /agenda do dia
  // criado. Antes o modal abria sem callback, user confirmava, modal
  // fechava e NADA persistia.
  const handleSave = async (payload: NewAppointmentPayload): Promise<{ ok: boolean; error?: string }> => {
    try {
      const localStart = new Date(`${payload.date}T${payload.time}:00`)
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: payload.clientId,
          professionalId: payload.professionalId,
          serviceIds: payload.serviceIds,
          startISO: localStart.toISOString(),
          date: payload.date,
          time: payload.time,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { ok: false, error: data.error || 'Erro ao criar agendamento' }
      }
      // Redireciona pra /agenda com query da data — o agenda-view lê e
      // já abre no dia certo, mostrando o agendamento recém-criado.
      router.push(`/agenda?date=${payload.date}`)
      return { ok: true }
    } catch (err) {
      console.error(err)
      return { ok: false, error: 'Erro de conexão. Tente novamente.' }
    }
  }

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
          {/* Badge de trial — só aparece quando relevante (não polui se for assinante há tempos) */}
          <TrialBadge />
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
        key={agendamentoOpen ? 'topbar-open' : 'topbar-closed'}
        open={agendamentoOpen}
        onClose={() => setAgendamentoOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}
