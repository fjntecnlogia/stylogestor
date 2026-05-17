'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/toast'
import { getInitialProfessionals, type ProfessionalFixture } from './__fixtures__/professionals'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

interface NovoProfForm { name: string; role: string; phone: string; commission: number }

export function ProfissionaisView() {
  const [professionals, setProfessionals] = useState<ProfessionalFixture[]>(() => getInitialProfessionals())
  const [selected, setSelected] = useState<ProfessionalFixture | null>(professionals[0] ?? null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<NovoProfForm>({ name: '', role: 'Barbeiro', phone: '', commission: 40 })
  const [editForm, setEditForm] = useState({ name: '', role: '', phone: '', commission: 0 })
  const { success } = useToast()

  const handleAdd = () => {
    if (!form.name || !form.phone) return
    const novo = {
      id: String(professionals.length + 1),
      name: form.name, role: form.role, phone: form.phone,
      commission: form.commission, active: true,
      schedules: [
        { day: 1, start: '09:00', end: '18:00' }, { day: 2, start: '09:00', end: '18:00' },
        { day: 3, start: '09:00', end: '18:00' }, { day: 4, start: '09:00', end: '18:00' },
        { day: 5, start: '09:00', end: '18:00' }, { day: 6, start: '09:00', end: '14:00' },
      ],
      stats: { month: 0, revenue: 0, commission: 0 },
    }
    setProfessionals(p => [...p, novo])
    setSelected(novo)
    setAdding(false)
    setForm({ name: '', role: 'Barbeiro', phone: '', commission: 40 })
    success(`Profissional ${form.name} cadastrado!`)
  }

  const handleEdit = () => {
    if (!selected) return
    setProfessionals(p => p.map(x => x.id === selected.id
      ? { ...x, name: editForm.name || x.name, role: editForm.role || x.role, phone: editForm.phone || x.phone, commission: editForm.commission || x.commission }
      : x
    ))
    setSelected(prev => prev && { ...prev, name: editForm.name || prev.name, role: editForm.role || prev.role, phone: editForm.phone || prev.phone, commission: editForm.commission || prev.commission })
    setEditing(false)
    success('Profissional atualizado!')
  }

  // Empty state quando NEXT_PUBLIC_USE_MOCKS=false e o módulo de profissionais
  // ainda não está plugado na API.
  if (!selected) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-12 text-center">
        <p className="text-5xl mb-3">✂️</p>
        <p className="font-sora font-bold text-[#111827] text-lg">Nenhum profissional cadastrado</p>
        <p className="text-sm text-[#6B7280] mt-1 mb-4">Cadastre o primeiro profissional pra começar a usar a agenda.</p>
        <button onClick={() => setAdding(true)}
          className="bg-[#1A3A6B] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#142d55] text-sm">
          + Novo profissional
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista */}
      <div className="space-y-3">
        <button onClick={() => { setAdding(true); setEditing(false) }}
          className="w-full bg-[#1A3A6B] text-white font-semibold py-2.5 rounded-xl hover:bg-[#142d55] transition-colors text-sm">
          + Novo profissional
        </button>

        {/* Modal adicionar */}
        {adding && (
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 space-y-3">
            <p className="font-semibold text-[#1A3A6B] text-sm">Novo profissional</p>
            <input placeholder="Nome completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
              {['Barbeiro','Cabeleireiro','Manicure','Esteticista','Outros'].map(r => <option key={r}>{r}</option>)}
            </select>
            <input placeholder="Telefone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            <div>
              <label className="text-xs text-[#4A4A5A]">Comissão: {form.commission}%</label>
              <input type="range" min="10" max="70" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: Number(e.target.value) }))} className="w-full" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 bg-[#1A3A6B] text-white text-sm font-bold py-2 rounded-xl hover:bg-[#142d55]">Salvar</button>
              <button onClick={() => setAdding(false)} className="flex-1 border border-[#E8E6E2] text-[#4A4A5A] text-sm py-2 rounded-xl hover:bg-[#F8F6F2]">Cancelar</button>
            </div>
          </div>
        )}

        {professionals.map((p) => (
          <button key={p.id} onClick={() => { setSelected(p); setEditing(false); setAdding(false) }}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${selected.id === p.id ? 'border-[#1A3A6B] bg-[#1A3A6B]/5' : 'bg-white border-[#E8E6E2] hover:border-[#1A3A6B]/40'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white font-bold text-lg shrink-0">{p.name.charAt(0)}</div>
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

        <div className="bg-white rounded-2xl border border-[#E8E6E2] p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-sora font-bold text-[#1C1C2E]">{selected.name}</h3>
            <button
              onClick={() => { setEditing(e => !e); setEditForm({ name: selected.name, role: selected.role, phone: selected.phone, commission: selected.commission }) }}
              className="text-xs text-[#1A3A6B] border border-[#1A3A6B]/30 px-3 py-1 rounded-lg hover:bg-[#1A3A6B]/5">
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {editing ? (
            <div className="space-y-3">
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome"
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
              <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="Telefone"
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
              <div>
                <label className="text-xs text-[#4A4A5A]">Comissão: {editForm.commission}%</label>
                <input type="range" min="10" max="70" value={editForm.commission} onChange={e => setEditForm(f => ({ ...f, commission: Number(e.target.value) }))} className="w-full" />
              </div>
              <button onClick={handleEdit} className="w-full bg-[#1A3A6B] text-white font-bold py-2.5 rounded-xl hover:bg-[#142d55]">
                Salvar alterações
              </button>
            </div>
          ) : (
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
          )}

          <div>
            <p className="text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide mb-3">Horários de trabalho</p>
            <div className="space-y-2">
              {DIAS.map((dia, i) => {
                const sched = selected.schedules.find((s) => s.day === i)
                return (
                  <div key={dia} className="flex items-center justify-between py-1.5 border-b border-[#E8E6E2] last:border-0">
                    <span className="text-sm font-medium text-[#1C1C2E] w-10">{dia}</span>
                    {sched ? <span className="text-sm text-[#4A4A5A]">{sched.start} — {sched.end}</span> : <span className="text-sm text-[#4A4A5A]/40">Folga</span>}
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
