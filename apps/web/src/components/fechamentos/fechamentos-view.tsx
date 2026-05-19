'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/toast'
import { FechamentoDiaModal } from '../agenda/fechamento-dia-modal'

interface ClosureItem {
  id: string
  date: string                     // YYYY-MM-DD
  totalIn: number
  totalOut: number
  net: number
  appointments: number
  cancelations: number
  totalCommissions: number
  byMethod: Record<string, number>
  closedAt: string
  notes: string
}

const METHOD_LABEL: Record<string, string> = {
  PIX: 'PIX', CASH: 'Dinheiro', CREDIT_CARD: 'Crédito',
  DEBIT_CARD: 'Débito', TRANSFER: 'Transferência', OTHER: 'Outros',
}

export function FechamentosView() {
  const [items, setItems] = useState<ClosureItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reopenDate, setReopenDate] = useState<string | null>(null)
  const [todayModalOpen, setTodayModalOpen] = useState(false)
  const { error } = useToast()

  const fetchHistory = () => {
    setLoading(true)
    fetch('/api/me/cash-closure/history?limit=60')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: ClosureItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err)
        error('Erro ao carregar histórico')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchHistory() }, [])

  // KPIs agregados dos últimos 30 fechamentos
  const last30 = items.slice(0, 30)
  const sumIn = last30.reduce((s, c) => s + c.totalIn, 0)
  const sumOut = last30.reduce((s, c) => s + c.totalOut, 0)
  const sumAppts = last30.reduce((s, c) => s + c.appointments, 0)

  const dateLabel = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    })

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-sora font-bold text-2xl text-[#1C1C2E]">🔒 Fechamentos de caixa</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Histórico de todos os dias fechados. Snapshots imutáveis pra auditoria.
          </p>
        </div>
        <button
          onClick={() => setTodayModalOpen(true)}
          className="bg-[#1A3A6B] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#142d55] transition-colors whitespace-nowrap"
        >
          🔒 Fechar caixa de hoje
        </button>
      </div>

      {/* KPIs últimos 30 */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-[#E8E6E2] rounded-2xl p-4">
            <p className="text-xs text-[#6B7280]">Dias fechados (últimos 30)</p>
            <p className="font-sora font-extrabold text-2xl text-[#1A3A6B] mt-1">{last30.length}</p>
          </div>
          <div className="bg-white border border-[#E8E6E2] rounded-2xl p-4">
            <p className="text-xs text-[#6B7280]">Entradas totais</p>
            <p className="font-sora font-extrabold text-2xl text-[#1B8A5A] mt-1">R$ {sumIn}</p>
          </div>
          <div className="bg-white border border-[#E8E6E2] rounded-2xl p-4">
            <p className="text-xs text-[#6B7280]">Saídas totais</p>
            <p className="font-sora font-extrabold text-2xl text-red-500 mt-1">R$ {sumOut}</p>
          </div>
          <div className="bg-white border border-[#E8E6E2] rounded-2xl p-4">
            <p className="text-xs text-[#6B7280]">Atendimentos</p>
            <p className="font-sora font-extrabold text-2xl text-[#F5A623] mt-1">{sumAppts}</p>
          </div>
        </div>
      )}

      {/* Lista de fechamentos */}
      <div className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E8E6E2] flex items-center justify-between">
          <p className="font-sora font-bold text-[#1C1C2E]">Histórico</p>
          <span className="text-xs text-[#9CA3AF]">{items.length} {items.length === 1 ? 'fechamento' : 'fechamentos'}</span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-[#6B7280]">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-4xl mb-2">📋</p>
            <p className="font-sora font-bold text-[#111827]">Nenhum caixa fechado ainda</p>
            <p className="text-xs text-[#6B7280] mt-1">
              Clique em <span className="font-semibold">🔒 Fechar caixa de hoje</span> pra criar o primeiro fechamento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {items.map((c) => (
              <button
                key={c.id}
                onClick={() => setReopenDate(c.date)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F8F6F2] transition-colors text-left"
              >
                <div className="w-12 text-center shrink-0">
                  <p className="text-[10px] font-bold text-[#9CA3AF] uppercase">
                    {dateLabel(c.date).split(',')[0]}
                  </p>
                  <p className="font-sora font-bold text-[#1A3A6B] text-sm">
                    {c.date.slice(8, 10)}/{c.date.slice(5, 7)}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1C1C2E] text-sm capitalize">{dateLabel(c.date)}</p>
                  <p className="text-xs text-[#6B7280]">
                    {c.appointments} atend · fechado em {new Date(c.closedAt).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  {/* Métodos resumidos */}
                  {Object.keys(c.byMethod).length > 0 && (
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {Object.entries(c.byMethod).map(([m, v]) => (
                        <span
                          key={m}
                          className="text-[10px] bg-[#F3F4F6] text-[#6B7280] px-1.5 py-0.5 rounded"
                        >
                          {METHOD_LABEL[m] ?? m}: R${v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-sora font-bold text-[#1B8A5A]">R$ {c.net}</p>
                  <p className="text-[10px] text-[#9CA3AF]">líquido</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal de fechamento — abre seja pra fechar hoje, seja pra ver um antigo */}
      <FechamentoDiaModal
        open={todayModalOpen || !!reopenDate}
        onClose={() => { setTodayModalOpen(false); setReopenDate(null); fetchHistory() }}
        date={reopenDate ?? today}
      />
    </div>
  )
}
