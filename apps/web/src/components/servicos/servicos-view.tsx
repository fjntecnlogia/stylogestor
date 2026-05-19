'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/toast'
import { getInitialServices, type ServiceFixture } from './__fixtures__/services'

const CATEGORIAS = ['Todos', 'Corte', 'Barba', 'Coloração', 'Tratamento', 'Outros']

export function ServicosView() {
  const [services, setServices] = useState<ServiceFixture[]>(() => getInitialServices())
  const [cat, setCat] = useState('Todos')
  const [editing, setEditing] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, { price: number; duration: number }>>({})
  const [adding, setAdding] = useState(false)
  const [newService, setNewService] = useState({ name: '', price: 0, duration: 30, category: 'Corte' })
  const { success, error } = useToast()

  // Hidrata do banco no mount (fonte de verdade)
  useEffect(() => {
    let cancelled = false
    fetch('/api/services')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: ServiceFixture[]) => {
        if (!cancelled && Array.isArray(data)) setServices(data)
      })
      .catch((err) => console.warn('[servicos] fetch falhou, usando initial', err))
    return () => { cancelled = true }
  }, [])

  const filtered = services.filter((s) => cat === 'Todos' || s.category === cat)

  const handleSave = async (id: string) => {
    const vals = editValues[id]
    if (!vals) { setEditing(null); return }
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: vals.price, duration: vals.duration }),
      })
      const updated = await res.json()
      if (!res.ok) { error(updated.error || 'Erro ao salvar'); return }
      setServices((p) => p.map((s) => (s.id === id ? { ...s, ...updated } : s)))
      setEditing(null)
      success('Serviço atualizado!')
    } catch (err) {
      error('Erro de conexão ao salvar')
      console.error(err)
    }
  }

  const handleToggle = async (id: string) => {
    const current = services.find((s) => s.id === id)
    if (!current) return
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !current.active }),
      })
      const updated = await res.json()
      if (!res.ok) { error(updated.error || 'Erro ao atualizar status'); return }
      setServices((p) => p.map((s) => (s.id === id ? { ...s, active: updated.active } : s)))
      success('Status do serviço atualizado!')
    } catch (err) {
      error('Erro de conexão')
      console.error(err)
    }
  }

  const handleAdd = async () => {
    if (!newService.name.trim()) return
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService),
      })
      const novo = await res.json()
      if (!res.ok) { error(novo.error || 'Erro ao criar serviço'); return }
      setServices((p) => [...p, novo])
      setAdding(false)
      setNewService({ name: '', price: 0, duration: 30, category: 'Corte' })
      success(`Serviço "${novo.name}" criado!`)
    } catch (err) {
      error('Erro de conexão ao criar serviço')
      console.error(err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-white border border-[#E8E6E2] rounded-xl p-1 flex-wrap">
          {CATEGORIAS.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${cat === c ? 'bg-[#1A3A6B] text-white' : 'text-[#4A4A5A] hover:text-[#1C1C2E]'}`}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => setAdding(a => !a)}
          className="bg-[#1A3A6B] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#142d55]">
          {adding ? '✕ Cancelar' : '+ Novo serviço'}
        </button>
      </div>

      {/* Formulário novo serviço */}
      {adding && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-5 space-y-3">
          <p className="font-semibold text-[#1A3A6B]">Novo serviço</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-[#4A4A5A] mb-1 block">Nome do serviço</label>
              <input placeholder="Ex: Corte degradê" value={newService.name} onChange={e => setNewService(s => ({ ...s, name: e.target.value }))}
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="text-xs text-[#4A4A5A] mb-1 block">Preço (R$)</label>
              <input type="number" value={newService.price} onChange={e => setNewService(s => ({ ...s, price: Number(e.target.value) }))}
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="text-xs text-[#4A4A5A] mb-1 block">Duração (min)</label>
              <input type="number" value={newService.duration} onChange={e => setNewService(s => ({ ...s, duration: Number(e.target.value) }))}
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[#4A4A5A] mb-1 block">Categoria</label>
              <select value={newService.category} onChange={e => setNewService(s => ({ ...s, category: e.target.value }))}
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
                {CATEGORIAS.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleAdd} className="w-full bg-[#1A3A6B] text-white font-bold py-2.5 rounded-xl hover:bg-[#142d55]">
            Criar serviço
          </button>
        </div>
      )}

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div key={s.id} className={`bg-white rounded-2xl border p-5 ${s.active ? 'border-[#E8E6E2]' : 'border-[#E8E6E2] opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-[#1C1C2E]">{s.name}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F8F6F2] text-[#4A4A5A]">{s.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(s.id)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${s.active ? 'bg-[#1B8A5A]' : 'bg-[#E8E6E2]'}`}
                  title={s.active ? 'Desativar' : 'Ativar'}>
                  <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${s.active ? 'left-4' : 'left-0.5'}`}></span>
                </button>
                <button onClick={() => {
                  setEditing(editing === s.id ? null : s.id)
                  setEditValues(v => ({ ...v, [s.id]: { price: s.price, duration: s.duration } }))
                }} className="text-xs text-[#4A4A5A] hover:text-[#1A3A6B]">✏️</button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#F8F6F2] rounded-xl py-2">
                <p className="font-bold text-[#1A3A6B] text-lg">R${s.price}</p>
                <p className="text-[10px] text-[#4A4A5A]">Preço</p>
              </div>
              <div className="bg-[#F8F6F2] rounded-xl py-2">
                <p className="font-bold text-[#1C1C2E] text-lg">{s.duration}m</p>
                <p className="text-[10px] text-[#4A4A5A]">Duração</p>
              </div>
              <div className="bg-[#F8F6F2] rounded-xl py-2">
                <p className="font-bold text-[#F5A623] text-lg">{s.count}</p>
                <p className="text-[10px] text-[#4A4A5A]">Realizados</p>
              </div>
            </div>

            {editing === s.id && (
              <div className="mt-3 pt-3 border-t border-[#E8E6E2] grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#4A4A5A] block mb-1">Preço (R$)</label>
                  <input value={editValues[s.id]?.price ?? s.price} type="number" onChange={e => setEditValues(v => ({ ...v, [s.id]: { ...v[s.id], price: Number(e.target.value) } }))}
                    className="w-full border border-[#E8E6E2] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A6B]" />
                </div>
                <div>
                  <label className="text-[10px] text-[#4A4A5A] block mb-1">Duração (min)</label>
                  <input value={editValues[s.id]?.duration ?? s.duration} type="number" onChange={e => setEditValues(v => ({ ...v, [s.id]: { ...v[s.id], duration: Number(e.target.value) } }))}
                    className="w-full border border-[#E8E6E2] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A6B]" />
                </div>
                <button onClick={() => handleSave(s.id)}
                  className="col-span-2 bg-[#1B8A5A] text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-[#156b47]">
                  Salvar alterações
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
