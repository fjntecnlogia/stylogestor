'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useToast } from '@/components/ui/toast'

interface Props {
  open: boolean
  onClose: () => void
  /** YYYY-MM-DD. Default: hoje. */
  date?: string
}

const METHOD_LABEL: Record<string, string> = {
  PIX: 'PIX', CASH: 'Dinheiro', CREDIT_CARD: 'Crédito',
  DEBIT_CARD: 'Débito', TRANSFER: 'Transferência', OTHER: 'Outros',
}
const METHOD_COLOR: Record<string, string> = {
  PIX: '#1B8A5A', CASH: '#F5A623', CREDIT_CARD: '#1A3A6B',
  DEBIT_CARD: '#7C3AED', TRANSFER: '#06B6D4', OTHER: '#9CA3AF',
}

interface ProfStats {
  id: string; name: string
  atendimentos: number; faturado: number; comissao: number; pct: number
}

interface ClosureData {
  closed: boolean
  id?: string
  date: string
  totalIn: number
  totalOut: number
  net: number
  appointments: number
  cancelations: number
  byMethod: Record<string, number>
  byProfessional: ProfStats[]
  totalCommissions: number
  closedAt?: string
  notes?: string
}

/**
 * Modal de fechamento de caixa do dia.
 *
 * Carrega via GET /api/me/cash-closure?date=... — se já foi fechado,
 * mostra como SNAPSHOT IMUTÁVEL. Se não, mostra preview ao vivo com
 * botão "Fechar caixa" pra persistir.
 *
 * Botões: Exportar CSV (sempre) · Fechar caixa (se ainda aberto)
 */
export function FechamentoDiaModal({ open, onClose, date }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const dayStr = date ?? todayStr
  const [data, setData] = useState<ClosureData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')
  const { success, error } = useToast()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/me/cash-closure?date=${dayStr}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: ClosureData) => { setData(d); setNotes(d.notes ?? '') })
      .catch((err) => {
        console.error('[fechamento] fetch falhou', err)
        error('Erro ao carregar fechamento')
      })
      .finally(() => setLoading(false))
  }, [open, dayStr, error])

  const handleClose = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/me/cash-closure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dayStr, notes }),
      })
      const json = await res.json()
      if (!res.ok) { error(json.error || 'Erro ao fechar caixa'); return }
      success(json.alreadyClosed ? 'Caixa já estava fechado' : 'Caixa fechado com sucesso! 💰')
      // Refetch pra mostrar o snapshot persistido
      const r2 = await fetch(`/api/me/cash-closure?date=${dayStr}`)
      if (r2.ok) setData(await r2.json())
    } catch (err) {
      error('Erro de conexão')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleExportCsv = () => {
    if (!data) return
    const dateLabel = new Date(`${dayStr}T12:00:00`).toLocaleDateString('pt-BR')
    const linhas: string[] = []
    linhas.push('STYLOGESTOR — Fechamento de Caixa')
    linhas.push(`Data;${dateLabel}`)
    linhas.push(`Status;${data.closed ? `Fechado em ${new Date(data.closedAt!).toLocaleString('pt-BR')}` : 'Aberto (preview)'}`)
    linhas.push('')
    linhas.push('Resumo')
    linhas.push(`Atendimentos concluídos;${data.appointments}`)
    linhas.push(`Cancelamentos;${data.cancelations}`)
    linhas.push(`Total entradas;R$ ${data.totalIn}`)
    linhas.push(`Total saídas;R$ ${data.totalOut}`)
    linhas.push(`LÍQUIDO;R$ ${data.net}`)
    linhas.push(`Comissões devidas;R$ ${data.totalCommissions}`)
    linhas.push('')
    linhas.push('Por forma de pagamento')
    Object.entries(data.byMethod).forEach(([m, v]) => {
      linhas.push(`${METHOD_LABEL[m] ?? m};R$ ${v}`)
    })
    linhas.push('')
    linhas.push('Por profissional')
    linhas.push('Nome;Atendimentos;Faturado;Comissão (%);Comissão (R$)')
    data.byProfessional.forEach((p) => {
      linhas.push(`${p.name};${p.atendimentos};R$ ${p.faturado};${p.pct}%;R$ ${p.comissao}`)
    })
    if (data.notes) {
      linhas.push('')
      linhas.push('Observações')
      linhas.push(data.notes)
    }

    const csv = '﻿' + linhas.join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fechamento-${dayStr}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    success('CSV exportado!')
  }

  const dateLabel = new Date(`${dayStr}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className={`px-6 py-4 ${data?.closed ? 'bg-[#1B8A5A]' : 'bg-[#1A3A6B]'}`}>
            <Dialog.Title className="text-white font-sora font-bold text-lg">
              💰 Fechamento de Caixa
            </Dialog.Title>
            <p className="text-white/70 text-sm mt-0.5 capitalize">{dateLabel}</p>
            {data?.closed && (
              <p className="text-[10px] text-white/60 mt-1">
                ✓ Fechado em {new Date(data.closedAt!).toLocaleString('pt-BR')} · snapshot imutável
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {loading || !data ? (
              <div className="py-10 text-center text-sm text-[#6B7280]">Carregando dados do dia...</div>
            ) : (
              <>
                {/* KPIs grandes */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#ECFDF5] border border-[#6EE7B7] rounded-2xl p-4 text-center">
                    <p className="text-xs text-[#065F46] font-semibold uppercase tracking-wide">Entradas</p>
                    <p className="font-sora font-extrabold text-2xl text-[#065F46] mt-1">R$ {data.totalIn}</p>
                  </div>
                  <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl p-4 text-center">
                    <p className="text-xs text-[#991B1B] font-semibold uppercase tracking-wide">Saídas</p>
                    <p className="font-sora font-extrabold text-2xl text-[#991B1B] mt-1">R$ {data.totalOut}</p>
                  </div>
                  <div className="bg-[#EFF6FF] border border-[#93C5FD] rounded-2xl p-4 text-center">
                    <p className="text-xs text-[#1E40AF] font-semibold uppercase tracking-wide">Líquido</p>
                    <p className="font-sora font-extrabold text-2xl text-[#1E40AF] mt-1">R$ {data.net}</p>
                  </div>
                </div>

                {/* Resumo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="font-sora font-bold text-xl text-[#1C1C2E]">{data.appointments}</p>
                    <p className="text-[10px] text-[#6B7280]">Atendimentos</p>
                  </div>
                  <div>
                    <p className="font-sora font-bold text-xl text-[#991B1B]">{data.cancelations}</p>
                    <p className="text-[10px] text-[#6B7280]">Cancelamentos</p>
                  </div>
                  <div>
                    <p className="font-sora font-bold text-xl text-[#F5A623]">R$ {data.totalCommissions}</p>
                    <p className="text-[10px] text-[#6B7280]">Comissões</p>
                  </div>
                  <div>
                    <p className="font-sora font-bold text-xl text-[#1A3A6B]">
                      R$ {data.appointments > 0 ? Math.round(data.totalIn / data.appointments) : 0}
                    </p>
                    <p className="text-[10px] text-[#6B7280]">Ticket médio</p>
                  </div>
                </div>

                {/* Por método */}
                {Object.keys(data.byMethod).length > 0 && (
                  <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
                    <p className="font-sora font-bold text-[#1C1C2E] text-sm mb-3">💳 Formas de pagamento</p>
                    <div className="space-y-2">
                      {Object.entries(data.byMethod).map(([m, v]) => {
                        const pct = data.totalIn > 0 ? Math.round((v / data.totalIn) * 100) : 0
                        const color = METHOD_COLOR[m] ?? METHOD_COLOR.OTHER
                        return (
                          <div key={m}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-[#374151]">{METHOD_LABEL[m] ?? m}</span>
                              <span className="font-bold" style={{ color }}>R$ {v} · {pct}%</span>
                            </div>
                            <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Por profissional */}
                {data.byProfessional.length > 0 && (
                  <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
                    <p className="font-sora font-bold text-[#1C1C2E] text-sm mb-3">👥 Por profissional</p>
                    <div className="divide-y divide-[#F3F4F6]">
                      {data.byProfessional.map((p) => (
                        <div key={p.id} className="py-2 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#1C1C2E] text-sm truncate">{p.name}</p>
                            <p className="text-xs text-[#6B7280]">
                              {p.atendimentos} {p.atendimentos === 1 ? 'atendimento' : 'atendimentos'} · faturou R$ {p.faturado}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-[#F5A623]">R$ {p.comissao}</p>
                            <p className="text-[10px] text-[#9CA3AF]">comissão {p.pct}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observações */}
                <div>
                  <label className="text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide block mb-1.5">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={data.closed}
                    placeholder="Ex: 1 cliente esqueceu de pagar, voltou no dia seguinte..."
                    className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] resize-none disabled:bg-[#F8F6F2]"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#E5E7EB] flex flex-wrap gap-2 justify-end">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 border-2 border-[#E5E7EB] text-[#374151] font-semibold rounded-xl hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
            >
              Fechar
            </button>
            {data && (
              <button
                onClick={handleExportCsv}
                className="px-4 py-2.5 bg-[#1B8A5A]/10 hover:bg-[#1B8A5A]/20 border-2 border-[#1B8A5A]/30 text-[#1B8A5A] font-bold rounded-xl"
              >
                📥 Exportar CSV
              </button>
            )}
            {data && !data.closed && (
              <button
                onClick={handleClose}
                disabled={saving}
                className="px-4 py-2.5 bg-[#1A3A6B] disabled:opacity-50 text-white font-bold rounded-xl hover:bg-[#142d55] transition-colors"
              >
                {saving ? 'Fechando...' : '🔒 Fechar caixa do dia'}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
