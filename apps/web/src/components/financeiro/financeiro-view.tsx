'use client'

import { useState } from 'react'

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'INCOME',  desc: 'Corte — Carlos Oliveira',  cat: 'Serviço',  method: 'PIX',     amount: 40,  time: '09:30' },
  { id: '2', type: 'INCOME',  desc: 'Barba — Rafael Santos',    cat: 'Serviço',  method: 'Dinheiro', amount: 30,  time: '10:00' },
  { id: '3', type: 'INCOME',  desc: 'Combo — Pedro Alves',      cat: 'Serviço',  method: 'Cartão',  amount: 60,  time: '10:45' },
  { id: '4', type: 'EXPENSE', desc: 'Shampoo profissional',      cat: 'Material', method: 'Dinheiro', amount: 85,  time: '11:00' },
  { id: '5', type: 'INCOME',  desc: 'Corte — Lucas Ferreira',   cat: 'Serviço',  method: 'PIX',     amount: 40,  time: '14:00' },
  { id: '6', type: 'INCOME',  desc: 'Produto — Pomada',         cat: 'Produto',  method: 'Dinheiro', amount: 35,  time: '14:30' },
]

const income = MOCK_TRANSACTIONS.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
const expense = MOCK_TRANSACTIONS.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

export function FinanceiroView() {
  const [addModal, setAddModal] = useState(false)
  const [tab, setTab] = useState<'all' | 'income' | 'expense'>('all')

  const filtered = MOCK_TRANSACTIONS.filter(
    (t) => tab === 'all' || (tab === 'income' ? t.type === 'INCOME' : t.type === 'EXPENSE')
  )

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E8E6E2] shadow-sm">
          <p className="text-xs text-[#4A4A5A] mb-1">Entradas de hoje</p>
          <p className="font-sora font-bold text-2xl text-[#1B8A5A]">R$ {income}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E8E6E2] shadow-sm">
          <p className="text-xs text-[#4A4A5A] mb-1">Saídas de hoje</p>
          <p className="font-sora font-bold text-2xl text-red-500">R$ {expense}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E8E6E2] shadow-sm">
          <p className="text-xs text-[#4A4A5A] mb-1">Saldo do dia</p>
          <p className="font-sora font-bold text-2xl text-[#1A3A6B]">R$ {income - expense}</p>
        </div>
      </div>

      {/* Tabela de transações */}
      <div className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6E2]">
          <div className="flex gap-1 bg-[#F8F6F2] rounded-xl p-1">
            {(['all', 'income', 'expense'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  tab === t ? 'bg-white text-[#1A3A6B] shadow-sm' : 'text-[#4A4A5A] hover:text-[#1C1C2E]'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'income' ? '↑ Entradas' : '↓ Saídas'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAddModal(true)}
              className="bg-[#1A3A6B] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#142d55]"
            >
              + Lançamento
            </button>
            <button className="border border-[#1B8A5A] text-[#1B8A5A] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#1B8A5A]/5">
              Fechar caixa
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
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
                    <span className={`w-2 h-2 rounded-full ${t.type === 'INCOME' ? 'bg-[#1B8A5A]' : 'bg-red-400'}`}></span>
                    <span className="font-medium text-[#1C1C2E]">{t.desc}</span>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-[#4A4A5A] hidden md:table-cell">{t.cat}</td>
                <td className="px-3 py-3.5 hidden md:table-cell">
                  <span className="text-xs bg-[#F8F6F2] px-2 py-0.5 rounded-md text-[#4A4A5A]">{t.method}</span>
                </td>
                <td className="px-3 py-3.5 text-[#4A4A5A] text-xs">{t.time}</td>
                <td className={`px-5 py-3.5 text-right font-bold ${t.type === 'INCOME' ? 'text-[#1B8A5A]' : 'text-red-500'}`}>
                  {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#E8E6E2] bg-[#F8F6F2]">
              <td colSpan={4} className="px-5 py-3 font-bold text-[#1C1C2E]">Saldo do dia</td>
              <td className="px-5 py-3 text-right font-sora font-bold text-lg text-[#1A3A6B]">R$ {income - expense}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
