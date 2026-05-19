'use client'

import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { useTenantPersistedState } from '@/lib/tenant-storage'
import { getInitialAppointments, type AppointmentFixture } from '../agenda/__fixtures__/appointments'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  CONFIRMED:   { label: 'Confirmado', cls: 'bg-[#1B8A5A]/10 text-[#1B8A5A]' },
  SCHEDULED:   { label: 'Aguardando', cls: 'bg-[#F5A623]/10 text-[#b07a10]' },
  IN_PROGRESS: { label: 'Em atend.',  cls: 'bg-[#FEE2E2] text-[#991B1B]' },
  COMPLETED:   { label: 'Concluído',  cls: 'bg-[#E5E7EB] text-[#6B7280]' },
  CANCELED:    { label: 'Cancelado',  cls: 'bg-red-50 text-red-500' },
  NO_SHOW:     { label: 'Faltou',     cls: 'bg-[#FEF2F2] text-[#991B1B]' },
}

export function AppointmentsToday() {
  const [apts, setApts] = useTenantPersistedState<AppointmentFixture[]>(
    'agenda:appointments',
    getInitialAppointments(),
  )
  const { success, error } = useToast()

  const handleDone = (id: string) => {
    setApts((p) => p.map((a) => (a.id === id ? { ...a, status: 'COMPLETED' } : a)))
    success('Atendimento concluído! ✅')
  }

  const handleCancel = (id: string) => {
    setApts((p) => p.map((a) => (a.id === id ? { ...a, status: 'CANCELED' } : a)))
    error('Agendamento cancelado')
  }

  const concluidos = apts.filter((a) => a.status === 'COMPLETED')
  const cancelados = apts.filter((a) => a.status === 'CANCELED')
  const pendentes = apts.filter((a) => ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status))
  const total = concluidos.reduce((s, a) => s + (a.price - a.discount), 0)
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

      {apts.length === 0 ? (
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
            {[...apts]
              .sort((a, b) => a.start.localeCompare(b.start))
              .slice(0, 5)
              .map((a) => {
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
                      <span className="text-xs font-bold text-[#1A3A6B] block">{a.start}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isFinal ? 'line-through text-[#9CA3AF]' : 'text-[#1C1C2E]'}`}>
                        {a.client}
                      </p>
                      <p className="text-xs text-[#6B7280] truncate">
                        {a.service} · <span className="font-semibold text-[#1B8A5A]">R$ {a.price - a.discount}</span>
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
    </div>
  )
}
