'use client'

import { useState, useCallback } from 'react'
import { format, addDays, subDays, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppointmentModal } from './appointment-modal'
import { AppointmentDetailModal } from './appointment-detail-modal'
import { FechamentoDiaModal } from './fechamento-dia-modal'

const PROFISSIONAIS = [
  { id: '1', name: 'João Silva',  color: '#1A3A6B', initials: 'JS' },
  { id: '2', name: 'Pedro Costa', color: '#7C3AED', initials: 'PC' },
]

const HORARIOS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00']

const STATUS_CONFIG = {
  COMPLETED:  { label: 'Concluído',  bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  CONFIRMED:  { label: 'Confirmado', bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  SCHEDULED:  { label: 'Agendado',   bg: '#FEF9C3', text: '#92400E', border: '#FCD34D' },
  IN_PROGRESS:{ label: 'Em atend.',  bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  CANCELED:   { label: 'Cancelado',  bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
  NO_SHOW:    { label: 'Faltou',     bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
}

// Agendamentos mock
const MOCK_APPOINTMENTS = [
  { id: '1', professionalId: '1', client: 'Carlos Oliveira', phone: '(11)99999-0001', service: 'Corte + Barba', price: 60, discount: 0, payMethod: 'PIX', start: '09:00', end: '09:45', status: 'COMPLETED', duration: 45, note: '' },
  { id: '2', professionalId: '1', client: 'Rafael Santos',   phone: '(11)99999-0002', service: 'Corte',        price: 40, discount: 0, payMethod: 'Dinheiro', start: '10:00', end: '10:30', status: 'COMPLETED', duration: 30, note: '' },
  { id: '3', professionalId: '2', client: 'Pedro Alves',     phone: '(11)99999-0003', service: 'Barba',        price: 30, discount: 5, payMethod: 'Cartão',  start: '09:30', end: '10:00', status: 'CONFIRMED', duration: 30, note: 'Cliente VIP' },
  { id: '4', professionalId: '1', client: 'Lucas Ferreira',  phone: '(11)99999-0004', service: 'Corte',        price: 40, discount: 0, payMethod: '',        start: '14:00', end: '14:30', status: 'SCHEDULED', duration: 30, note: '' },
  { id: '5', professionalId: '2', client: 'André Lima',      phone: '(11)99999-0005', service: 'Corte + Barba', price: 60, discount: 0, payMethod: 'PIX',    start: '14:30', end: '15:15', status: 'SCHEDULED', duration: 45, note: '' },
  { id: '6', professionalId: '1', client: 'Bruno Carvalho',  phone: '(11)99999-0006', service: 'Corte',        price: 40, discount: 0, payMethod: '',        start: '15:00', end: '15:30', status: 'IN_PROGRESS', duration: 30, note: '' },
]

export function AgendaView() {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'professional'>('professional')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [fechamentoOpen, setFechamentoOpen] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<typeof MOCK_APPOINTMENTS[0] | null>(null)
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS)

  const handleConcluir = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setAppointments(p => p.map(a => a.id === id ? { ...a, status: 'COMPLETED' } : a))
  }

  const handleCancelar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Cancelar este agendamento?')) {
      setAppointments(p => p.map(a => a.id === id ? { ...a, status: 'CANCELED' } : a))
    }
  }
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedProfId, setSelectedProfId] = useState('')

  const dateStr = format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  // Stats do dia
  const concluidos = MOCK_APPOINTMENTS.filter((a) => a.status === 'COMPLETED')
  const totalDia = concluidos.reduce((s, a) => s + a.price - a.discount, 0)
  const agendados = MOCK_APPOINTMENTS.filter((a) => ['SCHEDULED','CONFIRMED','IN_PROGRESS'].includes(a.status)).length
  const ticketMedio = concluidos.length ? Math.round(totalDia / concluidos.length) : 0

  const handleSlotClick = useCallback((time: string, profId: string) => {
    setSelectedTime(time)
    setSelectedProfId(profId)
    setNewModalOpen(true)
  }, [])

  const handleApptClick = useCallback((appt: typeof MOCK_APPOINTMENTS[0]) => {
    setSelectedAppt(appt)
    setDetailOpen(true)
  }, [])

  // Calcula posição em pixels (cada slot = 56px)
  const timeToSlotIndex = (time: string) => HORARIOS.indexOf(time)

  return (
    <div className="flex flex-col h-full gap-4">

      {/* ── Barra superior ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">

          {/* Navegação de data */}
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedDate((d) => subDays(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#374151] font-bold transition-colors">
              ‹
            </button>
            <div className="text-center">
              <p className="font-sora font-bold text-[#111827] text-sm capitalize">{dateStr}</p>
            </div>
            <button onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#374151] font-bold transition-colors">
              ›
            </button>
            <button onClick={() => setSelectedDate(new Date())}
              className="text-xs font-semibold text-[#1A3A6B] border border-[#1A3A6B]/30 px-3 py-1.5 rounded-lg hover:bg-[#1A3A6B]/5 transition-colors">
              Hoje
            </button>
          </div>

          {/* KPIs rápidos */}
          <div className="flex gap-3">
            {[
              { label: 'Atendidos', value: concluidos.length, color: '#1B8A5A' },
              { label: 'Agendados', value: agendados, color: '#1A3A6B' },
              { label: 'Ticket médio', value: `R$${ticketMedio}`, color: '#F5A623' },
              { label: 'Total do dia', value: `R$${totalDia}`, color: '#1B8A5A' },
            ].map((k) => (
              <div key={k.label} className="text-center bg-[#F9FAFB] rounded-xl px-3 py-2 hidden md:block">
                <p className="font-sora font-bold text-sm" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[10px] text-[#6B7280] font-medium">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            {/* Toggle de view */}
            <div className="flex bg-[#F3F4F6] rounded-xl p-1">
              {([['professional','👥 Profissionais'],['day','📅 Dia'],['week','📆 Semana']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === v ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280]'}`}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={() => setFechamentoOpen(true)}
              className="bg-[#1B8A5A] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#156b47] transition-colors">
              💰 Fechar caixa
            </button>
            <button onClick={() => { setSelectedTime(''); setSelectedProfId(''); setNewModalOpen(true) }}
              className="bg-[#1A3A6B] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#142d55] transition-colors">
              + Agendar
            </button>
          </div>
        </div>
      </div>

      {/* ── Legenda de status ── */}
      <div className="flex gap-3 flex-wrap px-1">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border" style={{ background: cfg.bg, borderColor: cfg.border }} />
            <span className="text-xs text-[#6B7280] font-medium">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* ── VISÃO MULTI-PROFISSIONAL ── */}
      {viewMode === 'professional' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-auto flex-1">
          <div className="flex min-w-[700px]">

            {/* Coluna de horários */}
            <div className="w-16 shrink-0 border-r border-[#E5E7EB] sticky left-0 bg-white z-10">
              <div className="h-14 border-b border-[#E5E7EB]" /> {/* Header vazio */}
              {HORARIOS.map((h) => (
                <div key={h} className="h-14 flex items-center justify-center border-b border-[#E5E7EB]/50">
                  <span className="text-xs text-[#9CA3AF] font-medium">{h}</span>
                </div>
              ))}
            </div>

            {/* Colunas dos profissionais */}
            {PROFISSIONAIS.map((prof) => {
              const appts = MOCK_APPOINTMENTS.filter((a) => a.professionalId === prof.id)
              return (
                <div key={prof.id} className="flex-1 min-w-[220px] border-r border-[#E5E7EB] last:border-r-0">
                  {/* Header do profissional */}
                  <div className="h-14 border-b border-[#E5E7EB] flex items-center gap-2 px-3 sticky top-0 bg-white z-10"
                    style={{ borderTop: `3px solid ${prof.color}` }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: prof.color }}>
                      {prof.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111827]">{prof.name}</p>
                      <p className="text-[10px] text-[#6B7280]">
                        {appts.filter((a) => a.status === 'COMPLETED').length} concluídos ·{' '}
                        R$ {appts.filter((a) => a.status === 'COMPLETED').reduce((s, a) => s + a.price - a.discount, 0)}
                      </p>
                    </div>
                  </div>

                  {/* Slots de horário */}
                  <div className="relative">
                    {HORARIOS.map((h) => (
                      <div key={h}
                        onClick={() => handleSlotClick(h, prof.id)}
                        className="h-14 border-b border-[#E5E7EB]/50 cursor-pointer hover:bg-[#F0F4FF] transition-colors group">
                        <div className="opacity-0 group-hover:opacity-100 w-full h-full flex items-center justify-center">
                          <span className="text-xs text-[#1A3A6B] font-semibold">+ {h}</span>
                        </div>
                      </div>
                    ))}

                    {/* Agendamentos posicionados absolutamente */}
                    {appts.map((appt) => {
                      const startIdx = timeToSlotIndex(appt.start)
                      if (startIdx < 0) return null
                      const slotCount = appt.duration / 30
                      const cfg = STATUS_CONFIG[appt.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.SCHEDULED

                      return (
                        <div key={appt.id}
                          onClick={(e) => { e.stopPropagation(); handleApptClick(appt) }}
                          className="absolute left-1 right-1 rounded-xl border px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden shadow-sm"
                          style={{
                            top: `${startIdx * 56 + 2}px`,
                            height: `${slotCount * 56 - 4}px`,
                            background: cfg.bg,
                            borderColor: cfg.border,
                          }}>
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold truncate" style={{ color: cfg.text }}>
                              {appt.client}
                            </p>
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0"
                              style={{ background: cfg.border, color: cfg.text }}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-[10px] font-medium truncate" style={{ color: cfg.text }}>
                            {appt.service}
                          </p>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[10px]" style={{ color: cfg.text }}>
                              {appt.start}–{appt.end}
                            </p>
                            <p className="text-[10px] font-bold" style={{ color: cfg.text }}>
                              R$ {appt.price - appt.discount}
                            </p>
                          </div>
                          {appt.payMethod && (
                            <p className="text-[9px] font-semibold mt-0.5" style={{ color: cfg.text }}>
                              {appt.payMethod}
                            </p>
                          )}
                          {appt.note && (
                            <p className="text-[9px] italic truncate" style={{ color: cfg.text }}>💬 {appt.note}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── VISÃO DIA ── */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Horário</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase">Cliente</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase">Serviço</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase">Profissional</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase">Desconto</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase">Pagamento</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase">Total</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase">Status</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {MOCK_APPOINTMENTS.sort((a, b) => a.start.localeCompare(b.start)).map((appt) => {
                const prof = PROFISSIONAIS.find((p) => p.id === appt.professionalId)
                const cfg = STATUS_CONFIG[appt.status as keyof typeof STATUS_CONFIG]
                return (
                  <tr key={appt.id} className="hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                    onClick={() => handleApptClick(appt)}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#374151]">
                      {appt.start}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-[#111827] text-sm">{appt.client}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{appt.phone}</p>
                    </td>
                    <td className="px-3 py-3 text-sm text-[#374151] font-medium">{appt.service}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ background: prof?.color }}>
                          {prof?.initials}
                        </div>
                        <span className="text-xs text-[#374151]">{prof?.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      {appt.discount > 0
                        ? <span className="text-red-500 font-semibold">-R$ {appt.discount}</span>
                        : <span className="text-[#9CA3AF]">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {appt.payMethod
                        ? <span className="text-xs font-semibold bg-[#F3F4F6] px-2 py-0.5 rounded-full text-[#374151]">{appt.payMethod}</span>
                        : <span className="text-[10px] text-[#9CA3AF]">Pendente</span>}
                    </td>
                    <td className="px-3 py-3 font-bold text-[#111827]">R$ {appt.price - appt.discount}</td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: cfg.bg, color: cfg.text }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        {appt.status !== 'COMPLETED' && appt.status !== 'CANCELED' && (
                          <button className="text-[10px] bg-[#1B8A5A]/10 text-[#1B8A5A] font-bold px-2 py-1 rounded-lg hover:bg-[#1B8A5A]/20"
                            onClick={(e) => handleConcluir(appt.id, e)}>
                            ✓ Concluir
                          </button>
                        )}
                        {appt.status !== 'CANCELED' && (
                          <button className="text-[10px] bg-red-50 text-red-500 font-bold px-2 py-1 rounded-lg hover:bg-red-100"
                            onClick={(e) => handleCancelar(appt.id, e)}>
                            ✗
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Totais */}
            <tfoot>
              <tr className="bg-[#F0F4FF] border-t-2 border-[#1A3A6B]/20">
                <td colSpan={4} className="px-4 py-3 font-sora font-bold text-[#111827]">
                  Resumo do dia — {MOCK_APPOINTMENTS.length} atendimentos
                </td>
                <td className="px-3 py-3 text-red-500 font-bold">
                  -R$ {MOCK_APPOINTMENTS.reduce((s, a) => s + a.discount, 0)}
                </td>
                <td className="px-3 py-3 text-xs text-[#374151]">
                  PIX: R$ {MOCK_APPOINTMENTS.filter(a=>a.payMethod==='PIX').reduce((s,a)=>s+a.price-a.discount,0)} ·{' '}
                  Din: R$ {MOCK_APPOINTMENTS.filter(a=>a.payMethod==='Dinheiro').reduce((s,a)=>s+a.price-a.discount,0)}
                </td>
                <td className="px-3 py-3 font-sora font-bold text-xl text-[#1B8A5A]">
                  R$ {totalDia}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── VISÃO SEMANA ── */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-auto flex-1">
          <div className="flex min-w-[800px]">
            <div className="w-16 shrink-0 border-r border-[#E5E7EB]">
              <div className="h-14 border-b border-[#E5E7EB]" />
              {HORARIOS.map((h) => (
                <div key={h} className="h-12 flex items-center justify-center border-b border-[#E5E7EB]/50">
                  <span className="text-xs text-[#9CA3AF]">{h}</span>
                </div>
              ))}
            </div>
            {Array.from({ length: 7 }).map((_, i) => {
              const day = addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i)
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              return (
                <div key={i} className="flex-1 border-r border-[#E5E7EB] last:border-r-0">
                  <div className={`h-14 border-b border-[#E5E7EB] flex flex-col items-center justify-center cursor-pointer ${isToday ? 'bg-[#1A3A6B]' : 'hover:bg-[#F9FAFB]'}`}
                    onClick={() => { setSelectedDate(day); setViewMode('professional') }}>
                    <p className={`text-xs font-semibold capitalize ${isToday ? 'text-white' : 'text-[#6B7280]'}`}>
                      {format(day, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-[#111827]'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                  {HORARIOS.map((h) => (
                    <div key={h} className="h-12 border-b border-[#E5E7EB]/50 hover:bg-[#F0F4FF] cursor-pointer transition-colors" />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modais */}
      <AppointmentModal open={newModalOpen} onClose={() => setNewModalOpen(false)} defaultDate="" />
      {selectedAppt && (
        <AppointmentDetailModal open={detailOpen} onClose={() => setDetailOpen(false)} event={selectedAppt} />
      )}
      <FechamentoDiaModal open={fechamentoOpen} onClose={() => setFechamentoOpen(false)} appointments={MOCK_APPOINTMENTS} totalDia={totalDia} />
    </div>
  )
}
