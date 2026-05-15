'use client'

import { useState } from 'react'
import { NovoClienteModal } from './novo-cliente-modal'
import { AppointmentModal } from '../agenda/appointment-modal'
import { useToast } from '@/components/ui/toast'

const MOCK_CLIENTS = [
  { id: '1', name: 'Carlos Oliveira', phone: '(11) 99999-0001', email: 'carlos@email.com', visits: 12, spent: 720,  lastVisit: '08/05/2026', tags: ['vip'],           segment: 'vip'    },
  { id: '2', name: 'Rafael Santos',   phone: '(11) 99999-0002', email: '',                 visits: 5,  spent: 200,  lastVisit: '05/05/2026', tags: [],                segment: 'risco'  },
  { id: '3', name: 'Pedro Alves',     phone: '(11) 99999-0003', email: 'pedro@email.com',  visits: 23, spent: 1380, lastVisit: '09/05/2026', tags: ['vip', 'mensal'], segment: 'vip'    },
  { id: '4', name: 'Lucas Ferreira',  phone: '(11) 99999-0004', email: '',                 visits: 3,  spent: 120,  lastVisit: '01/05/2026', tags: [],                segment: 'inativo'},
  { id: '5', name: 'André Lima',      phone: '(11) 99999-0005', email: 'andre@email.com',  visits: 8,  spent: 480,  lastVisit: '07/05/2026', tags: ['mensal'],        segment: 'regular'},
  { id: '6', name: 'Bruno Carvalho',  phone: '(11) 99999-0006', email: '',                 visits: 1,  spent: 40,   lastVisit: '02/05/2026', tags: [],                segment: 'novo'   },
  { id: '7', name: 'Diego Mendes',    phone: '(11) 99999-0007', email: 'diego@email.com',  visits: 2,  spent: 80,   lastVisit: '10/05/2026', tags: [],                segment: 'novo'   },
  { id: '8', name: 'Fábio Rocha',     phone: '(11) 99999-0008', email: '',                 visits: 15, spent: 900,  lastVisit: '03/04/2026', tags: ['vip'],           segment: 'inativo'},
]

const SEGMENTS = [
  { id: 'todos',   label: 'Todos',      icon: '👥', color: '#6B7280' },
  { id: 'vip',     label: 'VIP',        icon: '⭐', color: '#F5A623' },
  { id: 'risco',   label: 'Em risco',   icon: '⚠️', color: '#EF4444' },
  { id: 'inativo', label: 'Inativos',   icon: '💤', color: '#9CA3AF' },
  { id: 'novo',    label: 'Novos',      icon: '🆕', color: '#1B8A5A' },
  { id: 'regular', label: 'Regulares',  icon: '✅', color: '#1A3A6B' },
]

const TAG_COLORS: Record<string, string> = {
  vip:    'bg-[#FEF9C3] text-[#92400E]',
  mensal: 'bg-[#DBEAFE] text-[#1E40AF]',
}

function getScore(c: typeof MOCK_CLIENTS[0]) {
  return Math.min(100, Math.round((c.visits * 3) + (c.spent / 20)))
}

export function ClientesView() {
  const [search, setSearch]   = useState('')
  const [segment, setSegment] = useState('todos')
  const [selected, setSelected]     = useState<typeof MOCK_CLIENTS[0] | null>(null)
  const [novoOpen, setNovoOpen]     = useState(false)
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [clients, setClients]       = useState(MOCK_CLIENTS)
  const [sortBy, setSortBy]         = useState<'name' | 'visits' | 'spent'>('visits')
  const { success, info } = useToast()

  const filtered = clients
    .filter(c => segment === 'todos' || c.segment === segment)
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    )
    .sort((a, b) => {
      if (sortBy === 'visits') return b.visits - a.visits
      if (sortBy === 'spent')  return b.spent - a.spent
      return a.name.localeCompare(b.name)
    })

  const handleNovoCliente = (data: { name: string; phone: string; email: string; notes: string }) => {
    setClients(p => [{
      id: String(p.length + 1),
      name: data.name, phone: data.phone, email: data.email,
      visits: 0, spent: 0, lastVisit: '—', tags: [], segment: 'novo',
    }, ...p])
    success(`Cliente ${data.name} cadastrado! 👤`)
  }

  const handleWhatsApp = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Oi ${name.split(' ')[0]}! 😊 Tudo bem? Faz tempo que não te vemos aqui na barbearia. Que tal agendar um horário? 📅`)
    window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${msg}`, '_blank')
  }

  // Contadores por segmento
  const counts: Record<string, number> = { todos: clients.length }
  SEGMENTS.slice(1).forEach(s => {
    counts[s.id] = clients.filter(c => c.segment === s.id).length
  })

  const score = selected ? getScore(selected) : 0

  return (
    <div className="space-y-4">
      {/* Segmentação */}
      <div className="flex gap-2 flex-wrap">
        {SEGMENTS.map(s => (
          <button
            key={s.id}
            onClick={() => setSegment(s.id)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
              segment === s.id
                ? 'text-white border-transparent shadow-sm'
                : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#1A3A6B]'
            }`}
            style={segment === s.id ? { background: s.color } : {}}
          >
            <span>{s.icon}</span>
            {s.label}
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${segment === s.id ? 'bg-white/20' : 'bg-[#F3F4F6]'}`}>
              {counts[s.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="🔍 Buscar por nome ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
            />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
            >
              <option value="visits">↓ Visitas</option>
              <option value="spent">↓ Gasto</option>
              <option value="name">A-Z Nome</option>
            </select>
            <button
              onClick={() => setNovoOpen(true)}
              className="bg-[#1A3A6B] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#142d55] transition-colors whitespace-nowrap"
            >
              + Novo
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Cliente</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide hidden md:table-cell">Score</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide hidden md:table-cell">Visitas</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide hidden md:table-cell">Gasto</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Última visita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.map(c => {
                  const seg = SEGMENTS.find(s => s.id === c.segment)
                  const sc = getScore(c)
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className={`cursor-pointer transition-colors hover:bg-[#F9FAFB] ${selected?.id === c.id ? 'bg-[#EFF6FF]' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[#111827]">{c.name}</p>
                              {seg && <span className="text-sm" title={seg.label}>{seg.icon}</span>}
                            </div>
                            <p className="text-xs text-[#6B7280]">{c.phone}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 mt-1 ml-12 flex-wrap">
                          {c.tags.map(t => (
                            <span key={t} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TAG_COLORS[t] ?? 'bg-[#F3F4F6] text-[#6B7280]'}`}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <div className="flex items-center justify-center">
                          <div className="relative w-8 h-8">
                            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                              <circle cx="16" cy="16" r="13" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                              <circle cx="16" cy="16" r="13" fill="none" stroke={sc > 70 ? '#1B8A5A' : sc > 40 ? '#F5A623' : '#EF4444'}
                                strokeWidth="3" strokeDasharray={`${sc * 0.816} 100`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#374151]">{sc}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[#374151] font-medium hidden md:table-cell">{c.visits}x</td>
                      <td className="px-3 py-3 font-bold text-[#1B8A5A] hidden md:table-cell">R${c.spent}</td>
                      <td className="px-3 py-3 text-[#6B7280] text-xs">{c.lastVisit}</td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[#6B7280]">
                      <p className="text-4xl mb-2">👥</p>
                      <p className="font-semibold">Nenhum cliente encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Painel lateral */}
        <div>
          {selected ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden sticky top-4">
              {/* Header */}
              <div className="bg-[#1A3A6B] px-5 py-5 text-center">
                <div className="w-16 h-16 rounded-full bg-[#F5A623] flex items-center justify-center text-[#1A3A6B] text-2xl font-bold mx-auto mb-2">
                  {selected.name.charAt(0)}
                </div>
                <p className="font-sora font-bold text-white text-lg">{selected.name}</p>
                <p className="text-white/60 text-sm">{selected.phone}</p>
                {/* Score ring */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#F5A623]" style={{ width: `${score}%` }} />
                  </div>
                  <span className="text-xs font-bold text-[#F5A623]">Score {score}</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Visitas', value: selected.visits, icon: '📅' },
                    { label: 'Gasto', value: `R$${selected.spent}`, icon: '💰' },
                    { label: 'Última', value: selected.lastVisit, icon: '📆' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#F9FAFB] rounded-xl p-2.5 text-center">
                      <p className="text-base mb-0.5">{s.icon}</p>
                      <p className="font-bold text-[#111827] text-sm">{s.value}</p>
                      <p className="text-[10px] text-[#6B7280]">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setAgendaOpen(true) }}
                    className="bg-[#1A3A6B] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#142d55] transition-colors"
                  >
                    📅 Agendar
                  </button>
                  <button
                    onClick={() => handleWhatsApp(selected.phone, selected.name)}
                    className="bg-[#1B8A5A] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#166347] transition-colors"
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    onClick={() => { info('Histórico em breve!') }}
                    className="bg-[#F8F6F2] text-[#374151] text-xs font-bold py-2.5 rounded-xl hover:bg-[#E8E6E2] transition-colors"
                  >
                    📋 Histórico
                  </button>
                  <button
                    onClick={() => { success('Desconto de 10% enviado!') }}
                    className="bg-[#FFF7ED] text-[#92400E] text-xs font-bold py-2.5 rounded-xl hover:bg-[#FED7AA] transition-colors"
                  >
                    🎁 Enviar oferta
                  </button>
                </div>

                {/* Tags */}
                {selected.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {selected.tags.map(t => (
                      <span key={t} className={`text-xs font-bold px-2 py-0.5 rounded-full ${TAG_COLORS[t] ?? 'bg-[#F3F4F6] text-[#6B7280]'}`}>{t}</span>
                    ))}
                  </div>
                )}

                {/* Email */}
                {selected.email && (
                  <div className="bg-[#F9FAFB] rounded-xl p-3 text-xs text-[#374151]">
                    <span className="text-[#6B7280]">Email: </span>
                    <a href={`mailto:${selected.email}`} className="font-medium text-[#1A3A6B] hover:underline">{selected.email}</a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center text-[#6B7280]">
              <p className="text-4xl mb-3">👤</p>
              <p className="font-semibold">Selecione um cliente</p>
              <p className="text-sm mt-1">para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      <NovoClienteModal
        isOpen={novoOpen}
        onClose={() => setNovoOpen(false)}
        onSave={handleNovoCliente}
      />
      <AppointmentModal
        open={agendaOpen}
        onClose={() => { success('Agendamento criado! 📅'); setAgendaOpen(false) }}
      />
    </div>
  )
}
