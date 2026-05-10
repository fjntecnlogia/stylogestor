'use client'

import { useState } from 'react'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const MOCK = [
  { id: '1', name: 'João Silva', role: 'Barbeiro', phone: '(11) 99999-0001', commission: 40, active: true,
    schedules: [{ day: 1, start: '09:00', end: '18:00' }, { day: 2, start: '09:00', end: '18:00' }, { day: 3, start: '09:00', end: '18:00' }, { day: 4, start: '09:00', end: '18:00' }, { day: 5, start: '09:00', end: '18:00' }, { day: 6, start: '09:00', end: '14:00' }],
    stats: { month: 28, revenue: 2240, commission: 896 } },
  { id: '2', name: 'Pedro Costa', role: 'Cabeleireiro', phone: '(11) 99999-0002', commission: 35, active: true,
    schedules: [{ day: 1, start: '10:00', end: '19:00' }, { day: 2, start: '10:00', end: '19:00' }, { day: 3, start: '10:00', end: '19:00' }, { day: 4, start: '10:00', end: '19:00' }, { day: 5, start: '10:00', end: '19:00' }],
    stats: { month: 19, revenue: 1520, commission: 532 } },
]

export function ProfissionaisView() {
  const [selected, setSelected] = useState(MOCK[0])
  const [adding, setAdding] = useState(false)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista */}
      <div className="space-y-3">
        <button onClick={() => setAdding(true)}
          className="w-full bg-[#1A3A6B] text-white font-semibold py-2.5 rounded-xl hover:bg-[#142d55] transition-colors text-sm">
          + Novo profissional
        </button>
        {MOCK.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${selected.id === p.id ? 'border-[#1A3A6B] bg-[#1A3A6B]/5' : 'bg-white border-[#E8E6E2] hover:border-[#1A3A6B]/40'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white font-bold text-lg shrink-0">
                {p.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1C1C2E] truncate">{p.name}</p>
                <p className="text-xs text-[#4A4A5A]">{p.role} · {p.commission}% comissão</p>
              </div>
              <span className={`w-2 h-2 rounded-full ${p.active ? 'bg-[#1B8A5A]' : 'bg-[#4A4A5A]'}`}></span>
            </div>
          </button>
        ))}
      </div>

      {/* Detalhe */}
      <div className="lg:col-span-2 space-y-4">
        {/* Stats do mês */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Atendimentos/mês', value: selected.stats.month, color: '#1A3A6B' },
            { label: 'Faturado/mês',     value: `R$ ${selected.stats.revenue}`, color: '#1B8A5A' },
            { label: 'Comissão/mês',     value: `R$ ${selected.stats.commission}`, color: '#F5A623' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-[#E8E6E2] text-center">
              <p className="font-sora font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-[#4A4A5A] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Dados + Horários */}
        <div className="bg-white rounded-2xl border border-[#E8E6E2] p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-sora font-bold text-[#1C1C2E]">{selected.name}</h3>
            <button className="text-xs text-[#1A3A6B] border border-[#1A3A6B]/30 px-3 py-1 rounded-lg hover:bg-[#1A3A6B]/5">
              Editar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-[#4A4A5A]">Função</p><p className="font-medium">{selected.role}</p></div>
            <div><p className="text-xs text-[#4A4A5A]">Telefone</p><p className="font-medium">{selected.phone}</p></div>
            <div><p className="text-xs text-[#4A4A5A]">Comissão</p><p className="font-medium text-[#F5A623]">{selected.commission}%</p></div>
            <div><p className="text-xs text-[#4A4A5A]">Status</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selected.active ? 'bg-[#1B8A5A]/10 text-[#1B8A5A]' : 'bg-[#4A4A5A]/10 text-[#4A4A5A]'}`}>
                {selected.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide mb-3">Horários de trabalho</p>
            <div className="space-y-2">
              {DIAS.map((dia, i) => {
                const sched = selected.schedules.find((s) => s.day === i)
                return (
                  <div key={dia} className="flex items-center justify-between py-1.5 border-b border-[#E8E6E2] last:border-0">
                    <span className="text-sm font-medium text-[#1C1C2E] w-10">{dia}</span>
                    {sched ? (
                      <span className="text-sm text-[#4A4A5A]">{sched.start} — {sched.end}</span>
                    ) : (
                      <span className="text-sm text-[#4A4A5A]/40">Folga</span>
                    )}
                    <div className={`w-2 h-2 rounded-full ${sched ? 'bg-[#1B8A5A]' : 'bg-[#E8E6E2]'}`}></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
