'use client'

import { useState } from 'react'
import { NovoClienteModal } from './novo-cliente-modal'
import { AppointmentModal } from '../agenda/appointment-modal'
import { useToast } from '@/components/ui/toast'

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
  const { info } = useToast()
  const [novoClienteOpen, setNovoClienteOpen] = useState(false)
  const [agendamentoOpen, setAgendamentoOpen] = useState(false)
  const [clients, setClients] = useState(MOCK_CLIENTS)

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  const handleNovoCliente = (data: { name: string; phone: string; email: string; notes: string }) => {
    const newClient = {
      id: String(clients.length + 1),
      name: data.name,
      phone: data.phone,
      email: data.email,
      visits: 0,
      spent: 0,
      lastVisit: '—',
      tags: [],
    }
    setClients((prev) => [newClient, ...prev])
  }

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
            className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] font-medium placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
          />
          <button
            onClick={() => setNovoClienteOpen(true)}
            className="bg-[#1A3A6B] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#142d55] transition-colors whitespace-nowrap shadow-sm"
          >
            + Novo cliente
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Cliente</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide hidden md:table-cell">Visitas</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide hidden md:table-cell">Gasto total</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Última visita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`cursor-pointer transition-colors hover:bg-[#F9FAFB] ${selected?.id === c.id ? 'bg-[#EFF6FF]' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#111827]">{c.name}</p>
                        <p className="text-xs text-[#6B7280]">{c.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-1 ml-12 flex-wrap">
                      {c.tags.map((t) => (
                        <span key={t} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FEF9C3] text-[#92400E]">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-[#374151] font-medium hidden md:table-cell">{c.visits}x</td>
                  <td className="px-3 py-3.5 font-bold text-[#1B8A5A] hidden md:table-cell">R$ {c.spent}</td>
                  <td className="px-3 py-3.5 text-[#6B7280] text-xs font-medium">{c.lastVisit}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-[#6B7280]">
                    <p className="text-4xl mb-2">👥</p>
                    <p className="font-semibold">Nenhum cliente encontrado</p>
                    <p className="text-sm">Tente outro nome ou telefone</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalhe lateral */}
      <div className="space-y-4">
        {selected ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white text-xl font-bold">
                {selected.name.charAt(0)}
              </div>
              <div>
                <p className="font-sora font-bold text-[#111827]">{selected.name}</p>
                <p className="text-sm text-[#6B7280]">{selected.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F9FAFB] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[#1A3A6B]">{selected.visits}</p>
                <p className="text-xs text-[#6B7280] font-medium">Visitas</p>
              </div>
              <div className="bg-[#F9FAFB] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[#1B8A5A]">R${selected.spent}</p>
                <p className="text-xs text-[#6B7280] font-medium">Gasto total</p>
              </div>
            </div>

            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Última visita</span>
                <span className="font-semibold text-[#111827]">{selected.lastVisit}</span>
              </div>
              {selected.email && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">E-mail</span>
                  <span className="font-semibold text-[#111827] truncate ml-2 max-w-[140px]">{selected.email}</span>
                </div>
              )}
              {selected.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {selected.tags.map((t) => (
                    <span key={t} className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#92400E]">{t}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setAgendamentoOpen(true)}
                className="flex-1 bg-[#1A3A6B] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#142d55] transition-colors"
              >
                📅 Agendar
              </button>
              <button
                onClick={() => info('Edição de cliente em breve!')}
                className="flex-1 border-2 border-[#E5E7EB] text-[#374151] text-xs font-bold py-2.5 rounded-xl hover:bg-[#F9FAFB] transition-colors"
              >
                ✏️ Editar
              </button>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              Fechar detalhes
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center text-[#6B7280]">
            <p className="text-4xl mb-2">👈</p>
            <p className="font-semibold text-sm">Selecione um cliente para ver os detalhes</p>
            <button
              onClick={() => setNovoClienteOpen(true)}
              className="mt-4 text-xs text-[#1A3A6B] font-bold hover:underline"
            >
              + Cadastrar novo cliente
            </button>
          </div>
        )}
      </div>

      {/* Modais */}
      <NovoClienteModal
        open={novoClienteOpen}
        onClose={() => setNovoClienteOpen(false)}
        onSave={handleNovoCliente}
      />
      <AppointmentModal
        open={agendamentoOpen}
        onClose={() => setAgendamentoOpen(false)}
        defaultDate=""
      />
    </div>
  )
}
