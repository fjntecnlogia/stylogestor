'use client'

import { useState, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import { AppointmentModal } from './appointment-modal'
import { AppointmentDetailModal } from './appointment-detail-modal'

// Dados fictícios — serão substituídos pela API
const MOCK_EVENTS: EventInput[] = [
  { id: '1', title: 'Carlos Oliveira — Corte + Barba', start: new Date().toISOString().slice(0,10) + 'T14:00:00', end: new Date().toISOString().slice(0,10) + 'T14:45:00', backgroundColor: '#1A3A6B', borderColor: '#1A3A6B', extendedProps: { client: 'Carlos Oliveira', service: 'Corte + Barba', professional: 'João', price: 60, status: 'confirmed' } },
  { id: '2', title: 'Rafael Santos — Corte', start: new Date().toISOString().slice(0,10) + 'T14:30:00', end: new Date().toISOString().slice(0,10) + 'T15:00:00', backgroundColor: '#F5A623', borderColor: '#F5A623', extendedProps: { client: 'Rafael Santos', service: 'Corte', professional: 'Pedro', price: 40, status: 'pending' } },
  { id: '3', title: 'Pedro Alves — Barba', start: new Date().toISOString().slice(0,10) + 'T15:00:00', end: new Date().toISOString().slice(0,10) + 'T15:30:00', backgroundColor: '#1B8A5A', borderColor: '#1B8A5A', extendedProps: { client: 'Pedro Alves', service: 'Barba', professional: 'João', price: 30, status: 'confirmed' } },
  { id: '4', title: 'Lucas Ferreira — Combo', start: new Date().toISOString().slice(0,10) + 'T16:00:00', end: new Date().toISOString().slice(0,10) + 'T17:00:00', backgroundColor: '#1A3A6B', borderColor: '#1A3A6B', extendedProps: { client: 'Lucas Ferreira', service: 'Combo', professional: 'Pedro', price: 80, status: 'confirmed' } },
]

export function AgendaView() {
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null)

  const handleDateClick = useCallback((arg: DateClickArg) => {
    setSelectedDate(arg.dateStr)
    setNewModalOpen(true)
  }, [])

  const handleEventClick = useCallback((arg: EventClickArg) => {
    setSelectedEvent(arg.event)
    setDetailModalOpen(true)
  }, [])

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm overflow-hidden">
        {/* Toolbar customizada */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6E2]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#1A3A6B]"></span>
            <span className="text-xs text-[#4A4A5A]">Confirmado</span>
            <span className="w-3 h-3 rounded-full bg-[#F5A623] ml-3"></span>
            <span className="text-xs text-[#4A4A5A]">Aguardando</span>
            <span className="w-3 h-3 rounded-full bg-[#1B8A5A] ml-3"></span>
            <span className="text-xs text-[#4A4A5A]">Concluído</span>
          </div>
          <button
            onClick={() => { setSelectedDate(''); setNewModalOpen(true) }}
            className="bg-[#1A3A6B] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#142d55] transition-colors"
          >
            + Novo agendamento
          </button>
        </div>

        {/* FullCalendar */}
        <div className="p-4 fc-stylo">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridDay"
            locale={ptBrLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            slotDuration="00:30:00"
            allDaySlot={false}
            events={MOCK_EVENTS}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="calc(100vh - 280px)"
            nowIndicator
            selectable
            eventDisplay="block"
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
          />
        </div>
      </div>

      <AppointmentModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        defaultDate={selectedDate}
      />

      <AppointmentDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        event={selectedEvent}
      />
    </>
  )
}
