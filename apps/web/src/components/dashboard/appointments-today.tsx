'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/toast'

const INITIAL = [
  { id: '1', time: '14:00', client: 'Carlos Oliveira', service: 'Corte + Barba', value: 60, professional: 'João', status: 'confirmed' },
  { id: '2', time: '14:30', client: 'Rafael Santos',   service: 'Corte Social',   value: 40, professional: 'João', status: 'pending'   },
  { id: '3', time: '15:00', client: 'Pedro Alves',     service: 'Barba',          value: 30, professional: 'João', status: 'confirmed' },
  { id: '4', time: '15:30', client: 'Lucas Ferreira',  service: 'Corte + Barba', value: 60, professional: 'João', status: 'confirmed' },
  { id: '5', time: '16:00', client: 'André Lima',      service: 'Degradê',        value: 55, professional: 'João', status: 'pending'   },
]

const STATUS_MAP = {
  confirmed: { label: 'Confirmado', cls: 'bg-[#1B8A5A]/10 text-[#1B8A5A]', dot: '#1B8A5A' },
  pending:   { label: 'Aguardando', cls: 'bg-[#F5A623]/10 text-[#b07a10]', dot: '#F5A623' },
  done:      { label: 'Concluído',  cls: 'bg-[#E5E7EB] text-[#6B7280]',    dot: '#9CA3AF' },
  canceled:  { label: 'Cancelado',  cls: 'bg-red-50 text-red-500',          dot: '#EF4444' },
}

export function AppointmentsToday() {
  const [apts, setApts] = useState(INITIAL)
  const { success, error } = useToast()

  const handleDone = (id: string) => {
    setApts(p => p.map(a => a.id === id ? { ...a, status: 'done' } : a))
    success('Atendimento concluído! ✅')
  }

  const handleCancel = (id: string) => {
    setApts(p => p.map(a => a.id === id ? { ...a, status: 'canceled' } : a))
    error('Agendamento cancelado')
  }

  const total = apts.filter(a => a.status === 'done').reduce((s, a) => s + a.value, 0)
  const done = apts.filter(a => a.status === 'done').length
  const pending = apts.filter(a => a.status === 'pending' || a.status === 'confirmed').length

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E8E6E2] flex items-center justify-between">
        <div>
          <h2 className="font-sora font-bold text-[#1C1C2E]">📅 Agenda de hoje</h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{done} concluídos · {pending} restantes</p>
        </div>
        <a href="/agenda" className="text-xs bg-[#1A3A6B] text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-[#142d55] transition-colors">
          Abrir agenda →
        </a>
      </div>

      {/* Progress */}
      <div className="px-5 py-3 bg-[#F8F6F2] border-b border-[#E8E6E2]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#4A4A5A]">Progresso do dia</span>
          <span className="text-xs font-bold text-[#1A3A6B]">{Math.round(done/apts.length*100)}%</span>
        </div>
        <div className="h-1.5 bg-[#E8E6E2] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1A3A6B] rounded-full transition-all duration-500"
            style={{ width: `${done/apts.length*100}%` }}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="divide-y divide-[#F3F4F6]">
        {apts.map((a) => {
          const st = STATUS_MAP[a.status as keyof typeof STATUS_MAP]
          const isDone = a.status === 'done' || a.status === 'canceled'
          return (
            <div key={a.id} className={`flex items-center gap-3 px-5 py-3 transition-colors ${isDone ? 'opacity-50' : 'hover:bg-[#F8F6F2]'}`}>
              {/* Horário */}
              <div className="text-center w-12 shrink-0">
                <span className="text-xs font-bold text-[#1A3A6B] block">{a.time}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isDone ? 'line-through text-[#9CA3AF]' : 'text-[#1C1C2E]'}`}>{a.client}</p>
                <p className="text-xs text-[#6B7280] truncate">{a.service} · <span className="font-semibold text-[#1B8A5A]">R$ {a.value}</span></p>
              </div>

              {/* Status + ações */}
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                {!isDone && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDone(a.id)}
                      className="w-7 h-7 bg-[#ECFDF5] text-[#1B8A5A] rounded-lg text-xs font-bold hover:bg-[#1B8A5A] hover:text-white transition-colors"
                      title="Concluir"
                    >✓</button>
                    <button
                      onClick={() => handleCancel(a.id)}
                      className="w-7 h-7 bg-red-50 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
                      title="Cancelar"
                    >✕</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer com total */}
      <div className="px-5 py-3 bg-[#F8F6F2] border-t border-[#E8E6E2] flex justify-between items-center">
        <span className="text-sm text-[#4A4A5A]">Faturado hoje</span>
        <span className="font-sora font-bold text-[#1B8A5A]">R$ {total}</span>
      </div>
    </div>
  )
}
