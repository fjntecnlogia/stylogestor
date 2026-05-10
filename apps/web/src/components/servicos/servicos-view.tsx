'use client'

import { useState } from 'react'

const CATEGORIAS = ['Todos', 'Corte', 'Barba', 'Coloração', 'Tratamento', 'Outros']

const MOCK_SERVICES = [
  { id: '1', name: 'Corte masculino',   price: 40, duration: 30, category: 'Corte',     active: true,  count: 124 },
  { id: '2', name: 'Barba',             price: 30, duration: 30, category: 'Barba',     active: true,  count: 98  },
  { id: '3', name: 'Corte + Barba',     price: 60, duration: 45, category: 'Corte',     active: true,  count: 87  },
  { id: '4', name: 'Pigmentação',       price: 80, duration: 60, category: 'Coloração', active: true,  count: 23  },
  { id: '5', name: 'Hidratação',        price: 70, duration: 45, category: 'Tratamento',active: true,  count: 31  },
  { id: '6', name: 'Sobrancelha',       price: 20, duration: 15, category: 'Outros',    active: false, count: 12  },
]

export function ServicosView() {
  const [cat, setCat] = useState('Todos')
  const [editing, setEditing] = useState<string | null>(null)

  const filtered = MOCK_SERVICES.filter((s) => cat === 'Todos' || s.category === cat)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-white border border-[#E8E6E2] rounded-xl p-1">
          {CATEGORIAS.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${cat === c ? 'bg-[#1A3A6B] text-white' : 'text-[#4A4A5A] hover:text-[#1C1C2E]'}`}>
              {c}
            </button>
          ))}
        </div>
        <button className="bg-[#1A3A6B] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#142d55]">
          + Novo serviço
        </button>
      </div>

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
                <span className={`w-2 h-2 rounded-full ${s.active ? 'bg-[#1B8A5A]' : 'bg-[#4A4A5A]/30'}`}></span>
                <button onClick={() => setEditing(editing === s.id ? null : s.id)}
                  className="text-xs text-[#4A4A5A] hover:text-[#1A3A6B]">✏️</button>
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
                  <input defaultValue={s.price} type="number" className="w-full border border-[#E8E6E2] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A6B]" />
                </div>
                <div>
                  <label className="text-[10px] text-[#4A4A5A] block mb-1">Duração (min)</label>
                  <input defaultValue={s.duration} type="number" className="w-full border border-[#E8E6E2] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A6B]" />
                </div>
                <button className="col-span-2 bg-[#1B8A5A] text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-[#156b47]">
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
