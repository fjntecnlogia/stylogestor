'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import {
  getInitialTransactions,
  getInitialWeekData,
  getInitialPaymentMethods,
  type TransactionFixture,
  type WeekDataFixture,
  type PaymentMethodFixture,
} from './__fixtures__/transactions'

export function FinanceiroView() {
  const [tab, setTab]           = useState<'all' | 'income' | 'expense'>('all')
  const [periodo, setPeriodo]   = useState<'hoje' | 'semana' | 'mes'>('hoje')
  const [addModal, setAddModal] = useState(false)
  const [newDesc, setNewDesc]   = useState('')
  const [newVal, setNewVal]     = useState('')
  const [newType, setNewType]   = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [newMethod, setNewMethod] = useState('PIX')
  const [transactions, setTransactions] = useState<TransactionFixture[]>(() => getInitialTransactions())
  const [chartData, setChartData]       = useState<WeekDataFixture[]>(() => getInitialWeekData())
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodFixture[]>(() => getInitialPaymentMethods())
  const [loading, setLoading]           = useState(false)
  const [isRealData, setIsRealData]     = useState(false)
  const { success } = useToast()

  // Buscar dados reais da API
  const fetchData = useCallback(async (p: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/financeiro?periodo=${p}`)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.transactions?.length >= 0) {
        setTransactions(data.transactions.length > 0 ? data.transactions : getInitialTransactions())
        if (data.chartData?.length > 0) setChartData(data.chartData)
        if (data.paymentMethods?.length > 0) setPaymentMethods(data.paymentMethods)
        setIsRealData(data.transactions.length > 0)
      }
    } catch {
      // Fallback para mock se API falhar
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(periodo) }, [periodo, fetchData])

  const filtered = transactions.filter(
    (t) => tab === 'all' || (tab === 'income' ? t.type === 'INCOME' : t.type === 'EXPENSE')
  )

  const currentIncome  = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const currentExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

  const handleAddTransaction = () => {
    if (!newDesc || !newVal) return
    const novo = {
      id: String(transactions.length + 1),
      type: newType,
      desc: newDesc,
      cat: newType === 'INCOME' ? 'Serviço' : 'Despesa',
      method: newMethod,
      amount: Number(newVal),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: 'Hoje',
    }
    setTransactions((p) => [novo, ...p])
    setNewDesc(''); setNewVal('')
    setAddModal(false)
    success(`${newType === 'INCOME' ? 'Entrada' : 'Saída'} de R$ ${newVal} registrada!`)
  }

  return (
    <div className="space-y-5">

      {/* Filtro de período + Exportar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-sora font-bold text-xl text-[#111827]">
          Financeiro {loading && <span className="text-sm font-normal text-[#6B7280]">⏳</span>}
        </h1>
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-white border border-[#E5E7EB] rounded-xl p-1">
            {(['hoje', 'semana', 'mes'] as const).map((p) => (
              <button key={p} onClick={() => setPeriodo(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  periodo === p ? 'bg-[#1A3A6B] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
                }`}>
                {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
          {/* Exportar CSV */}
          <button
            onClick={() => {
              const BOM = '﻿'
              const now = new Date().toLocaleDateString('pt-BR')
              const rows = [
                `RELATORIO FINANCEIRO - STYLOGESTOR`,
                `Periodo;${periodo === 'hoje' ? 'Hoje' : periodo === 'semana' ? 'Esta semana' : 'Este mes'}`,
                `Gerado em;${now}`,
                ``,
                `Entradas;R$ ${currentIncome}`,
                `Saidas;R$ ${currentExpense}`,
                `Saldo;R$ ${currentIncome - currentExpense}`,
                ``,
                `Data;Descricao;Categoria;Tipo;Metodo;Valor`,
                ...transactions.map(t => `${t.date};${t.desc};${t.cat};${t.type === 'INCOME' ? 'Entrada' : 'Saida'};${t.method};${t.amount}`),
              ]
              const csv = BOM + rows.join('\r\n')
              const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const u = URL.createObjectURL(b)
              const a = document.createElement('a')
              a.href = u; a.download = `financeiro-${periodo}-${now.replace(/\//g,'-')}.csv`; a.click()
              success('CSV exportado!')
            }}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-[#1B8A5A]/10 text-[#1B8A5A] hover:bg-[#1B8A5A]/20 border border-[#1B8A5A]/20"
          >
            📥 CSV
          </button>
          {/* Exportar PDF */}
          <button
            onClick={() => {
              const now = new Date().toLocaleDateString('pt-BR')
              const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório Financeiro</title>
              <style>body{font-family:Arial;padding:32px;color:#1C1C2E}h1{color:#1A3A6B}.logo{font-weight:900;font-size:20px;letter-spacing:-1px}.logo span{color:#F5A623}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#1A3A6B;color:white;padding:10px;text-align:left;font-size:12px}td{padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:12px}.income{color:#1B8A5A;font-weight:bold}.expense{color:#EF4444;font-weight:bold}.summary{display:flex;gap:16px;margin:20px 0}.kpi{background:#F0F4FF;padding:12px 16px;border-radius:8px;flex:1;text-align:center}.kpi-val{font-size:20px;font-weight:900;color:#1A3A6B}.kpi-label{font-size:11px;color:#6B7280}.header{display:flex;justify-content:space-between;border-bottom:3px solid #1A3A6B;padding-bottom:12px;margin-bottom:20px}.footer{margin-top:40px;padding-top:12px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF;display:flex;justify-content:space-between}</style></head><body>
              <div class="header"><div><div class="logo">STYLO<span>GESTOR</span></div><div style="font-size:12px;color:#6B7280">Sistema de Gestão para Barbearias</div></div><div style="text-align:right"><div style="font-size:16px;font-weight:bold">Relatório Financeiro</div><div style="font-size:12px;color:#6B7280">${periodo === 'hoje' ? 'Hoje' : periodo === 'semana' ? 'Esta semana' : 'Este mês'} · ${now}</div></div></div>
              <div class="summary"><div class="kpi"><div class="kpi-label">Entradas</div><div class="kpi-val" style="color:#1B8A5A">R$ ${currentIncome}</div></div><div class="kpi"><div class="kpi-label">Saídas</div><div class="kpi-val" style="color:#EF4444">R$ ${currentExpense}</div></div><div class="kpi"><div class="kpi-label">Saldo</div><div class="kpi-val">R$ ${currentIncome - currentExpense}</div></div><div class="kpi"><div class="kpi-label">Transações</div><div class="kpi-val" style="color:#F5A623">${transactions.length}</div></div></div>
              <table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Método</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>${transactions.map(t=>`<tr><td>${t.date}</td><td>${t.desc}</td><td>${t.cat}</td><td>${t.method}</td><td class="${t.type==='INCOME'?'income':'expense'}">${t.type==='INCOME'?'Entrada':'Saída'}</td><td class="${t.type==='INCOME'?'income':'expense'}">R$ ${t.amount}</td></tr>`).join('')}</tbody></table>
              <div class="footer"><div>© ${new Date().getFullYear()} STYLOGESTOR</div><div>Gerado em ${now} · Documento confidencial</div></div>
              <script>window.onload=()=>window.print()</script></body></html>`
              const w = window.open('', '_blank', 'width=900,height=700')
              if (w) { w.document.write(html); w.document.close() }
            }}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-[#60A5FA]/10 text-[#1D4ED8] hover:bg-[#60A5FA]/20 border border-[#60A5FA]/30"
          >
            🖨️ PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Entradas',    value: currentIncome,              color: 'text-[#1B8A5A]', icon: '↑', bg: 'bg-[#F0FDF4]' },
          { label: 'Saídas',      value: currentExpense,             color: 'text-red-500',   icon: '↓', bg: 'bg-[#FEF2F2]' },
          { label: 'Saldo',       value: currentIncome - currentExpense, color: 'text-[#1A3A6B]', icon: '=', bg: 'bg-[#EFF6FF]' },
          { label: 'Ticket médio', value: Math.round(currentIncome / Math.max(filtered.filter(t=>t.type==='INCOME').length, 1)), color: 'text-[#F5A623]', icon: '~', bg: 'bg-[#FFFBEB]' },
        ].map((k) => (
          <div key={k.label} className={`${k.bg} rounded-2xl p-4 border border-[#E5E7EB]`}>
            <p className="text-xs text-[#6B7280] font-medium">{k.label}</p>
            <p className={`font-sora font-extrabold text-xl mt-1 ${k.color}`}>R$ {k.value}</p>
          </div>
        ))}
      </div>

      {/* Gráfico de barras */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-sora font-bold text-[#111827]">
              Receita — {isRealData ? '📊 dados reais' : '📋 dados demonstração'}
            </p>
            {loading && <p className="text-xs text-[#6B7280]">Carregando...</p>}
          </div>
          <div className="flex gap-3 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1A3A6B] inline-block" /> Entrada</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300 inline-block" /> Saída</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-36">
          {chartData.slice(-7).map((d) => {
            const maxB = Math.max(...chartData.map(x => x.income), 1)
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '120px', justifyContent: 'flex-end' }}>
                  {d.expense > 0 && (
                    <div className="w-full bg-red-200 rounded-t" style={{ height: `${(d.expense / maxB) * 100}%`, minHeight: 4 }} />
                  )}
                  <div className="w-full bg-[#1A3A6B] rounded-t" style={{ height: `${(d.income / maxB) * 100}%`, minHeight: 4 }} />
                </div>
                <p className="text-[10px] text-[#6B7280] font-medium">{d.day}</p>
                <p className="text-[10px] font-bold text-[#1A3A6B]">R${d.income}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Forma de pagamento */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <p className="font-sora font-bold text-[#111827] mb-4">Formas de pagamento</p>
        <div className="space-y-3">
          {paymentMethods.map((pm) => (
            <div key={pm.method}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-[#374151]">{pm.method}</span>
                <span className="font-bold" style={{ color: pm.color }}>R$ {pm.total} · {pm.pct}%</span>
              </div>
              <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pm.pct}%`, background: pm.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transações */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] flex-wrap gap-2">
          <div className="flex gap-1 bg-[#F8F6F2] rounded-xl p-1">
            {(['all', 'income', 'expense'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  tab === t ? 'bg-white text-[#1A3A6B] shadow-sm' : 'text-[#4A4A5A] hover:text-[#1C1C2E]'
                }`}>
                {t === 'all' ? 'Todos' : t === 'income' ? '↑ Entradas' : '↓ Saídas'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddModal(true)}
              className="bg-[#1A3A6B] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#142d55] transition-colors">
              + Lançamento
            </button>
            <Link
              href="/agenda"
              className="border border-[#1B8A5A] text-[#1B8A5A] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#1B8A5A]/5 transition-colors">
              Fechar caixa →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-[#F8F6F2] border-b border-[#E8E6E2]">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide">Descrição</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide hidden md:table-cell">Categoria</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide hidden md:table-cell">Forma</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide">Hora</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6E2]">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-[#F8F6F2] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${t.type === 'INCOME' ? 'bg-[#1B8A5A]' : 'bg-red-400'}`} />
                      <span className="font-medium text-[#1C1C2E]">{t.desc}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-[#4A4A5A] hidden md:table-cell">{t.cat}</td>
                  <td className="px-3 py-3.5 hidden md:table-cell">
                    <span className="text-xs bg-[#F8F6F2] border border-[#E5E7EB] px-2 py-0.5 rounded-md text-[#4A4A5A]">{t.method}</span>
                  </td>
                  <td className="px-3 py-3.5 text-[#4A4A5A] text-xs">{t.time}</td>
                  <td className={`px-5 py-3.5 text-right font-bold ${t.type === 'INCOME' ? 'text-[#1B8A5A]' : 'text-red-500'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-[#6B7280] text-sm">Nenhuma transação encontrada</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#E8E6E2] bg-[#F8F6F2]">
                <td colSpan={4} className="px-5 py-3 font-bold text-[#1C1C2E]">Saldo do dia</td>
                <td className="px-5 py-3 text-right font-sora font-bold text-lg text-[#1A3A6B]">R$ {currentIncome - currentExpense}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal de lançamento */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#1A3A6B] px-6 py-4">
              <h2 className="font-sora font-bold text-white text-lg">+ Novo lançamento</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                {(['INCOME', 'EXPENSE'] as const).map((t) => (
                  <button key={t} onClick={() => setNewType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      newType === t
                        ? t === 'INCOME' ? 'bg-[#D1FAE5] border-[#1B8A5A] text-[#065F46]' : 'bg-[#FEE2E2] border-red-400 text-red-700'
                        : 'border-[#E5E7EB] text-[#6B7280]'
                    }`}>
                    {t === 'INCOME' ? '↑ Entrada' : '↓ Saída'}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1">Descrição *</label>
                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Corte — João Silva"
                  className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1">Valor (R$) *</label>
                  <input type="number" value={newVal} onChange={(e) => setNewVal(e.target.value)}
                    placeholder="0,00"
                    className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1">Forma de pagamento</label>
                  <select value={newMethod} onChange={(e) => setNewMethod(e.target.value)}
                    className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] bg-white">
                    {['PIX', 'Dinheiro', 'Cartão', 'Boleto'].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setAddModal(false)}
                className="flex-1 border-2 border-[#E5E7EB] text-[#374151] font-semibold py-2.5 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                Cancelar
              </button>
              <button onClick={handleAddTransaction} disabled={!newDesc || !newVal}
                className="flex-1 bg-[#1A3A6B] disabled:opacity-40 text-white font-bold py-2.5 rounded-xl hover:bg-[#142d55] transition-colors">
                ✓ Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
