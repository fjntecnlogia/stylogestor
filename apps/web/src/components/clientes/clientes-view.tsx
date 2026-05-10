'use client'

import { useState } from 'react'

const MOCK_CLIENTS = [
  { id: '1', name: 'Carlos Oliveira', phone: '(11) 99999-0001', email: 'carlos@email.com', visits: 12, spent: 720, lastVisit: '08/05/2026', tags: ['vip'] },
  { id: '2', name: 'Rafael Santos',   phone: '(11) 99999-0002', email: '',                 visits: 5,  spent: 200, lastVisit: '05/05/2026', tags: [] },
  { id: '3', name: 'Pedro Alves',     phone: '(11) 99999-0003', email: 'pedro@email.com',  visits: 23, spent: 1380, lastVisit: '09/05/2026', tags: ['vip', 'mensal'] },
  { id: '4', name: 'Lucas Ferreira',  phone: '(11) 99999-0004', email: '',                 visits: 3,  spent: 120, lastVisit: '01/05/2026', tags: [] },
  { id: '5', name: 'André Lima',      phone: '(11) 99999-0005', email: 'andre@email.com',  visits: 8,  spent: 480, lastVisit: '07/05/2026', tags: ['mensal'] },
  { id: '6', name: 'Bruno Carvalho',  phone: '(11) 99999-0006', email: '',                 visits: 1,  spent: 40,  lastVisit: '02/05/2026', tags: [] },
]

export function ClientesView() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<typeof MOCK_CLIENTS[0] | null>(null)

  const filtered = MOCK_CLIENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="🔍 Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white border border-[#E8E6E2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
          />
          <button className="bg-[#1A3A6B] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#142d55] transition-colors whitespace-nowrap">
            + Novo cliente
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F6F2] border-b border-[#E8E6E2]">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide">Cliente</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide hidden md:table-cell">Visitas</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide hidden md:table-cell">Gasto total</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide">Última visita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6E2]">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`cursor-pointer transition-colors hover:bg-[#F8F6F2] ${selected?.id === c.id ? 'bg-[#1A3A6B]/5' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#1C1C2E]">{c.name}</p>
                        <p className="text-xs text-[#4A4A5A]">{c.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-1 ml-11">
                      {c.tags.map((t) => (
                        <span key={t} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F5A623]/15 text-[#b07a10]">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-[#4A4A5A] hidden md:table-cell">{c.visits}x</td>
                  <td className="px-3 py-3.5 font-medium text-[#1B8A5A] hidden md:table-cell">R$ {c.spent}</td>
                  <td className="px-3 py-3.5 text-[#4A4A5A] text-xs">{c.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#4A4A5A]">
              <p className="text-4xl mb-2">👥</p>
              <p className="font-medium">Nenhum cliente encontrado</p>
              <p className="text-sm">Tente outro nome ou telefone</p>
            </div>
          )}
        </div>
      </div>

      {/* Detalhe lateral */}
      <div className="space-y-4">
        {selected ? (
          <div className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white text-xl font-bold">
                {selected.name.charAt(0)}
              </div>
              <div>
                <p className="font-sora font-bold text-[#1C1C2E]">{selected.name}</p>
                <p className="text-sm text-[#4A4A5A]">{selected.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F8F6F2] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[#1A3A6B]">{selected.visits}</p>
                <p className="text-xs text-[#4A4A5A]">Visitas</p>
              </div>
              <div className="bg-[#F8F6F2] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[#1B8A5A]">R${selected.spent}</p>
                <p className="text-xs text-[#4A4A5A]">Gasto total</p>
              </div>
            </div>

            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-[#4A4A5A]">Última visita</span>
                <span className="font-medium">{selected.lastVisit}</span>
              </div>
              {selected.email && (
                <div className="flex justify-between">
                  <span className="text-[#4A4A5A]">E-mail</span>
                  <span className="font-medium truncate ml-2">{selected.email}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-[#1A3A6B] text-white text-xs font-semibold py-2 rounded-lg hover:bg-[#142d55]">
                📅 Agendar
              </button>
              <button className="flex-1 border border-[#E8E6E2] text-[#4A4A5A] text-xs font-semibold py-2 rounded-lg hover:bg-[#F8F6F2]">
                ✏️ Editar
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm p-8 text-center text-[#4A4A5A]">
            <p className="text-4xl mb-2">👈</p>
            <p className="font-medium text-sm">Selecione um cliente para ver os detalhes</p>
          </div>
        )}
      </div>
    </div>
  )
}
