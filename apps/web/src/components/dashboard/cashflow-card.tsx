'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getInitialEntries, getInitialWeek } from './__fixtures__/cashflow'

const METHOD_COLORS: Record<string, string> = {
  PIX:      '#1B8A5A',
  Dinheiro: '#F5A623',
  Cartão:   '#1A3A6B',
}

export function CashflowCard() {
  const [view, setView] = useState<'hoje' | 'semana'>('hoje')
  // Carregado uma vez no mount; quando a API existir trocar por fetch.
  const [entries] = useState(() => getInitialEntries())
  const [week] = useState(() => getInitialWeek())

  const totalIn  = entries.filter(e => e.type === 'in').reduce((s, e) => s + e.value, 0)
  const totalOut = entries.filter(e => e.type === 'out').reduce((s, e) => s + e.value, 0)
  const net      = totalIn - totalOut
  const maxWeek  = week.length > 0 ? Math.max(...week.map(d => d.v)) : 1

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E8E6E2] flex items-center justify-between">
        <div>
          <h2 className="font-sora font-bold text-[#1C1C2E]">💰 Financeiro</h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Resumo do caixa</p>
        </div>
        <div className="flex bg-[#F3F4F6] rounded-lg p-0.5">
          {(['hoje', 'semana'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`text-xs font-semibold px-3 py-1 rounded-md transition-all capitalize ${view === v ? 'bg-white text-[#1A3A6B] shadow-sm' : 'text-[#6B7280]'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'hoje' ? (
        <>
          {/* KPIs rápidos */}
          <div className="grid grid-cols-3 divide-x divide-[#F3F4F6] border-b border-[#E8E6E2]">
            <div className="px-4 py-3 text-center">
              <p className="text-xs text-[#9CA3AF] mb-1">Entradas</p>
              <p className="font-sora font-bold text-[#1B8A5A] text-lg">R${totalIn}</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xs text-[#9CA3AF] mb-1">Saídas</p>
              <p className="font-sora font-bold text-red-500 text-lg">R${totalOut}</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xs text-[#9CA3AF] mb-1">Lucro</p>
              <p className="font-sora font-bold text-[#1A3A6B] text-lg">R${net}</p>
            </div>
          </div>

          {/* Lançamentos */}
          <div className="divide-y divide-[#F3F4F6]">
            {entries.map((e, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-2.5 hover:bg-[#F8F6F2] transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: METHOD_COLORS[e.method] ?? '#9CA3AF' }} />
                  <span className="text-sm text-[#4A4A5A]">{e.label}</span>
                  <span className="text-[10px] text-[#9CA3AF] bg-[#F3F4F6] px-1.5 py-0.5 rounded">{e.method}</span>
                </div>
                <span className={`text-sm font-semibold ${e.type === 'in' ? 'text-[#1B8A5A]' : 'text-red-500'}`}>
                  {e.type === 'in' ? '+' : '-'}R${e.value}
                </span>
              </div>
            ))}
          </div>

          {/* Total + botão */}
          <div className="px-5 py-4 bg-[#F8F6F2] border-t border-[#E8E6E2]">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-[#1C1C2E]">Total do dia</span>
              <span className="font-sora font-bold text-xl text-[#1B8A5A]">R$ {net}</span>
            </div>
            <Link
              href="/agenda"
              className="w-full bg-[#1A3A6B] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#142d55] transition-colors flex items-center justify-center gap-2"
            >
              🔒 Fechar caixa do dia →
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Gráfico de barras semanal */}
          <div className="px-5 py-5">
            <p className="text-xs text-[#9CA3AF] mb-4">Faturamento — últimos 7 dias</p>
            <div className="flex items-end gap-2 h-32">
              {week.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-[#9CA3AF] font-semibold">
                    R${d.v >= 1000 ? (d.v/1000).toFixed(1)+'k' : d.v}
                  </span>
                  <div className="w-full rounded-t-lg transition-all hover:opacity-80"
                    style={{
                      height: `${(d.v / maxWeek) * 96}px`,
                      background: d.day === 'Sab' ? '#1A3A6B' : '#DBEAFE',
                    }}
                  />
                  <span className="text-[10px] text-[#6B7280] font-medium">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#E8E6E2] flex justify-between items-center">
              <span className="text-sm text-[#4A4A5A]">Total da semana</span>
              <span className="font-sora font-bold text-[#1A3A6B]">
                R$ {week.reduce((s, d) => s + d.v, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
