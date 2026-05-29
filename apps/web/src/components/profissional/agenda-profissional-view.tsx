'use client'

import { useState, useMemo } from 'react'
import { useUser } from '@/lib/use-user'
import { format, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/components/ui/toast'
import { useTenantPersistedState } from '@/lib/tenant-storage'
import { getInitialAppointments, type AppointmentFixture } from '../agenda/__fixtures__/appointments'

const STATUS_CONFIG = {
  SCHEDULED:   { label: 'Agendado',   bg: '#FEF9C3', text: '#92400E', border: '#FCD34D' },
  CONFIRMED:   { label: 'Confirmado', bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  IN_PROGRESS: { label: 'Em atend.',  bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  COMPLETED:   { label: 'Concluído',  bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  CANCELED:    { label: 'Cancelado',  bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
  NO_SHOW:     { label: 'Faltou',     bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

export function AgendaProfissionalView() {
  const { user } = useUser()
  // ID do profissional logado vem do app_metadata (setado no convite).
  // Fallback '1' pra testar enquanto não tem auth real configurada.
  const professionalId = (user?.app_metadata as { professionalId?: string } | undefined)?.professionalId ?? '1'

  const [selectedDate, setSelectedDate] = useState(new Date())
  const { success, info } = useToast()

  // Carrega TODOS os agendamentos do storage compartilhado e filtra os deste profissional.
  const [allAppointments, setAllAppointments] = useTenantPersistedState<AppointmentFixture[]>(
    'agenda:appointments',
    getInitialAppointments(),
  )

  // Filtra agendamentos do barbeiro logado
  const meusAgendamentos = useMemo(
    () => allAppointments.filter((a) => a.professionalId === professionalId),
    [allAppointments, professionalId],
  )

  // Stats do dia (futuro: filtrar por selectedDate quando endpoint real existir)
  const concluidos = meusAgendamentos.filter((a) => a.status === 'COMPLETED')
  const agendados = meusAgendamentos.filter((a) => ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status))
  const totalDia = concluidos.reduce((s, a) => s + a.price - a.discount, 0)
  const ticketMedio = concluidos.length ? Math.round(totalDia / concluidos.length) : 0

  const updateStatus = (id: string, status: StatusKey) => {
    setAllAppointments((p) => p.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  const handleConcluir = (id: string) => {
    updateStatus(id, 'COMPLETED')
    success('Atendimento concluído ✅')
  }

  const handleCancelar = (id: string) => {
    if (!confirm('Cancelar este agendamento?')) return
    updateStatus(id, 'CANCELED')
    success('Agendamento cancelado')
  }

  const handleNoShow = (id: string) => {
    updateStatus(id, 'NO_SHOW')
    info('Marcado como não compareceu')
  }

  const handleWhatsApp = (a: AppointmentFixture) => {
    if (!a.phone) {
      info('Cliente sem telefone cadastrado')
      return
    }
    const firstName = a.client.split(' ')[0]
    const msg = encodeURIComponent(
      `Oi ${firstName}! 😊 Confirmando seu horário das ${a.start} hoje. Te espero!`,
    )
    const phone = a.phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank', 'noopener,noreferrer')
  }

  const dateStr = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-sora font-extrabold text-2xl text-[#1C1C2E]">Minha Agenda</h1>
        <p className="text-sm text-[#6B7280]">Veja e gerencie seus atendimentos do dia</p>
      </div>

      {/* Navegação de data */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 flex items-center justify-between">
        <button
          onClick={() => setSelectedDate((d) => subDays(d, 1))}
          aria-label="Dia anterior"
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#E5E7EB] hover:bg-[#F8F6F2] text-[#374151] text-xl font-bold"
        >
          ‹
        </button>
        <div className="text-center flex-1">
          <p className="font-sora font-bold text-[#111827] capitalize text-base">{dateStr}</p>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-xs text-[#1A3A6B] font-semibold hover:underline mt-0.5"
          >
            Voltar pra hoje
          </button>
        </div>
        <button
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          aria-label="Próximo dia"
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#E5E7EB] hover:bg-[#F8F6F2] text-[#374151] text-xl font-bold"
        >
          ›
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Atendidos', value: concluidos.length, sub: 'hoje', color: '#1B8A5A' },
          { label: 'Agendados', value: agendados.length, sub: 'restantes', color: '#1A3A6B' },
          { label: 'Total do dia', value: `R$ ${totalDia}`, sub: 'faturamento', color: '#1B8A5A' },
          { label: 'Ticket médio', value: `R$ ${ticketMedio}`, sub: 'por atendimento', color: '#F5A623' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-[#E5E7EB] p-3 shadow-sm">
            <p className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider">{k.label}</p>
            <p className="font-sora font-extrabold text-xl mt-0.5" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-[#9CA3AF] font-medium mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Lista de agendamentos */}
      <div className="space-y-2">
        {meusAgendamentos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center">
            <p className="text-4xl mb-2">📅</p>
            <p className="font-sora font-bold text-[#111827]">Nenhum atendimento hoje</p>
            <p className="text-sm text-[#6B7280] mt-1">Quando alguém agendar com você, aparece aqui.</p>
          </div>
        ) : (
          [...meusAgendamentos]
            .sort((a, b) => a.start.localeCompare(b.start))
            .map((a) => {
              const cfg = STATUS_CONFIG[a.status as StatusKey] ?? STATUS_CONFIG.SCHEDULED
              const isFinal = a.status === 'COMPLETED' || a.status === 'CANCELED' || a.status === 'NO_SHOW'
              const total = a.price - a.discount

              return (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl border-l-4 border border-[#E5E7EB] shadow-sm p-4"
                  style={{ borderLeftColor: cfg.border }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-sora font-bold text-[#111827]">{a.client}</p>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.text }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-[#374151] mt-0.5">{a.service}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        🕐 {a.start} – {a.end} · {a.payMethod || 'Pagamento pendente'}
                      </p>
                      {a.note && (
                        <p className="text-xs text-[#92400E] bg-[#FEF9C3] px-2 py-1 rounded-lg mt-2 inline-block">
                          💬 {a.note}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-sora font-bold text-lg text-[#1B8A5A]">R$ {total}</p>
                      {a.discount > 0 && (
                        <p className="text-[10px] text-red-500">-R$ {a.discount} desc.</p>
                      )}
                    </div>
                  </div>

                  {/* Botões de ação */}
                  {!isFinal && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#E5E7EB]">
                      <button
                        onClick={() => handleConcluir(a.id)}
                        className="flex-1 min-w-[120px] bg-[#1B8A5A] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#156b47] transition-colors"
                      >
                        ✓ Concluir
                      </button>
                      <button
                        onClick={() => handleWhatsApp(a)}
                        className="flex-1 min-w-[120px] bg-[#25D366]/10 text-[#128C7E] text-xs font-bold py-2 rounded-xl hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/30"
                      >
                        💬 WhatsApp
                      </button>
                      <button
                        onClick={() => handleNoShow(a.id)}
                        className="bg-[#FFF7ED] text-[#92400E] text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#FED7AA] transition-colors"
                      >
                        Faltou
                      </button>
                      <button
                        onClick={() => handleCancelar(a.id)}
                        className="bg-red-50 text-red-500 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )
            })
        )}
      </div>
    </div>
  )
}
