'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { useDashboardData } from './use-dashboard-data'
import {
  CompleteAppointmentModal,
  type AppointmentToComplete,
} from '../agenda/complete-appointment-modal'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  CONFIRMED:   { label: 'Confirmado', cls: 'bg-[#1B8A5A]/10 text-[#1B8A5A]' },
  SCHEDULED:   { label: 'Aguardando', cls: 'bg-[#F5A623]/10 text-[#b07a10]' },
  IN_PROGRESS: { label: 'Em atend.',  cls: 'bg-[#FEE2E2] text-[#991B1B]' },
  COMPLETED:   { label: 'Concluído',  cls: 'bg-[#E5E7EB] text-[#6B7280]' },
  CANCELED:    { label: 'Cancelado',  cls: 'bg-red-50 text-red-500' },
  NO_SHOW:     { label: 'Faltou',     cls: 'bg-[#FEF2F2] text-[#991B1B]' },
}

export function AppointmentsToday() {
  const { data, loading, refresh } = useDashboardData()
  const { error } = useToast()
  const apts = data.agendamentosHoje
  // Modal de seleção de forma de pagamento ao concluir
  const [completing, setCompleting] = useState<AppointmentToComplete | null>(null)

  const handleDone = (id: string) => {
    const apt = apts.find((a) => a.id === id)
    if (!apt) return
    setCompleting({
      id: apt.id,
      client: apt.clientName,
      service: apt.services,
      price: apt.totalPrice,
      time: apt.time,
    })
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancelar este agendamento?')) return
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELED' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        error(err.error || 'Erro ao cancelar')
        return
      }
      error('Agendamento cancelado')
      refresh()
    } catch (err) {
      error('Erro de conexão')
      console.error(err)
    }
  }

  const concluidos = apts.filter((a) => a.status === 'COMPLETED')
  const cancelados = apts.filter((a) => a.status === 'CANCELED')
  const pendentes = apts.filter((a) => ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status))
  const total = data.kpis.totalHoje
  const progressPct = apts.length > 0 ? Math.round((concluidos.length / apts.length) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E8E6E2] flex items-center justify-between">
        <div>
          <h2 className="font-sora font-bold text-[#1C1C2E]">📅 Agenda de hoje</h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            {concluidos.length} concluídos · {pendentes.length} restantes
          </p>
        </div>
        <Link href="/agenda" className="text-xs bg-[#1A3A6B] text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-[#142d55] transition-colors">
          Abrir agenda →
        </Link>
      </div>

      {loading ? (
        <div className="px-5 py-10 text-center text-sm text-[#9CA3AF]">Carregando...</div>
      ) : apts.length === 0 ? (
        // Empty state — sem agendamentos
        <div className="px-5 py-10 text-center">
          <p className="text-4xl mb-2">📅</p>
          <p className="font-sora font-bold text-[#111827] text-sm">Nenhum agendamento hoje</p>
          <p className="text-xs text-[#6B7280] mt-1">
            Marque pela <Link href="/agenda" className="text-[#1A3A6B] font-semibold hover:underline">agenda</Link> ou aguarde que o cliente reserve pelo link público.
          </p>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="px-5 py-3 bg-[#F8F6F2] border-b border-[#E8E6E2]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#4A4A5A]">Progresso do dia</span>
              <span className="text-xs font-bold text-[#1A3A6B]">{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-[#E8E6E2] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1A3A6B] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Lista (top 5) */}
          <div className="divide-y divide-[#F3F4F6]">
            {apts.slice(0, 5).map((a) => {
              const st = STATUS_MAP[a.status] ?? STATUS_MAP.SCHEDULED
              const isFinal = a.status === 'COMPLETED' || a.status === 'CANCELED' || a.status === 'NO_SHOW'
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                    isFinal ? 'opacity-50' : 'hover:bg-[#F8F6F2]'
                  }`}
                >
                  <div className="text-center w-12 shrink-0">
                    <span className="text-xs font-bold text-[#1A3A6B] block">{a.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isFinal ? 'line-through text-[#9CA3AF]' : 'text-[#1C1C2E]'}`}>
                      {a.clientName}
                    </p>
                    <p className="text-xs text-[#6B7280] truncate">
                      {a.services} · <span className="font-semibold text-[#1B8A5A]">R$ {a.totalPrice}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    {!isFinal && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDone(a.id)}
                          aria-label="Concluir"
                          className="w-7 h-7 bg-[#ECFDF5] text-[#1B8A5A] rounded-lg text-xs font-bold hover:bg-[#1B8A5A] hover:text-white transition-colors"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleCancel(a.id)}
                          aria-label="Cancelar"
                          className="w-7 h-7 bg-red-50 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer com total */}
          <div className="px-5 py-3 bg-[#F8F6F2] border-t border-[#E8E6E2] flex justify-between items-center">
            <span className="text-sm text-[#4A4A5A]">
              Faturado hoje {cancelados.length > 0 && <span className="text-[10px] text-[#9CA3AF]">({cancelados.length} cancelados)</span>}
            </span>
            <span className="font-sora font-bold text-[#1B8A5A]">R$ {total}</span>
          </div>
        </>
      )}

      {/* Modal de seleção de forma de pagamento */}
      <CompleteAppointmentModal
        appointment={completing}
        onClose={() => setCompleting(null)}
        onSuccess={() => { refresh() }}
      />
    </div>
  )
}
