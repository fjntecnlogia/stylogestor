'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/toast'

const WEEK_DATA = [
  { day: 'Seg', income: 320, expense: 0 },
  { day: 'Ter', income: 450, expense: 85 },
  { day: 'Qua', income: 280, expense: 0 },
  { day: 'Qui', income: 520, expense: 120 },
  { day: 'Sex', income: 680, expense: 0 },
  { day: 'Sab', income: 890, expense: 45 },
  { day: 'Dom', income: 205, expense: 0 },
]

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'INCOME',  desc: 'Corte — Carlos Oliveira',  cat: 'Serviço',  method: 'PIX',      amount: 40,  time: '09:30', date: 'Hoje' },
  { id: '2', type: 'INCOME',  desc: 'Barba — Rafael Santos',    cat: 'Serviço',  method: 'Dinheiro', amount: 30,  time: '10:00', date: 'Hoje' },
  { id: '3', type: 'INCOME',  desc: 'Combo — Pedro Alves',      cat: 'Serviço',  method: 'Cartão',   amount: 60,  time: '10:45', date: 'Hoje' },
  { id: '4', type: 'EXPENSE', desc: 'Shampoo profissional',      cat: 'Material', method: 'Dinheiro', amount: 85,  time: '11:00', date: 'Hoje' },
  { id: '5', type: 'INCOME',  desc: 'Corte — Lucas Ferreira',   cat: 'Serviço',  method: 'PIX',      amount: 40,  time: '14:00', date: 'Hoje' },
  { id: '6', type: 'INCOME',  desc: 'Produto — Pomada',         cat: 'Produto',  method: 'Dinheiro', amount: 35,  time: '14:30', date: 'Hoje' },
]

const PAYMENT_METHODS = [
  { method: 'PIX',      total: 80,  pct: 37, color: '#1B8A5A' },
  { method: 'Dinheiro', total: 65,  pct: 30, color: '#F5A623' },
  { method: 'Cartão',   total: 60,  pct: 28, color: '#1A3A6B' },
  { method: 'Outros',   total: 10,  pct: 5,  color: '#9CA3AF' },
]

const income  = MOCK_TRANSACTIONS.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
const expense = MOCK_TRANSACTIONS.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
const maxBar  = Math.max(...WEEK_DATA.map((d) => d.income))

export function FinanceiroView() {
  const [tab, setTab]           = useState<'all' | 'income' | 'expense'>('all')
  const [periodo, setPeriodo]   = useState<'hoje' | 'semana' | 'mes'>('hoje')
  const [addModal, setAddModal] = useState(false)
  const [newDesc, setNewDesc]   = useState('')
  const [newVal, setNewVal]     = useState('')
  const [newType, setNewType]   = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [newMethod, setNewMethod] = useState('PIX')
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS)
  const { success } = useToast()

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

      {/* Filtro de período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-sora font-bold text-xl text-[#111827]">Financeiro</h1>
        <div className="flex bg-white border border-[#E5E7EB] rounded-xl p-1 w-fit">
          {(['hoje', 'semana', 'mes'] as const).map((p) => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                periodo === p ? 'bg-[#1A3A6B] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
              }`}>
              {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
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

      {/* Gráfico de barras da semana */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-sora font-bold text-[#111827]">Receita — últimos 7 dias</p>
          <div className="flex gap-3 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1A3A6B] inline-block" /> Entrada</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300 inline-block" /> Saída</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-36">
          {WEEK_DATA.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '120px', justifyContent: 'flex-end' }}>
                {d.expense > 0 && (
                  <div
                    className="w-full bg-red-200 rounded-t"
                    style={{ height: `${(d.expense / maxBar) * 100}%`, minHeight: 4 }}
                  />
                )}
                <div
                  className="w-full bg-[#1A3A6B] rounded-t"
                  style={{ height: `${(d.income / maxBar) * 100}%`, minHeight: 4 }}
                />
              </div>
              <p className="text-[10px] text-[#6B7280] font-medium">{d.day}</p>
              <p className="text-[10px] font-bold text-[#1A3A6B]">R${d.income}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Forma de pagamento */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <p className="font-sora font-bold text-[#111827] mb-4">Formas de pagamento hoje</p>
        <div className="space-y-3">
          {PAYMENT_METHODS.map((pm) => (
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
            <button
              onClick={() => success('Caixa fechado! Resumo salvo.')}
              className="border border-[#1B8A5A] text-[#1B8A5A] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#1B8A5A]/5 transition-colors">
              Fechar caixa
            </button>
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
