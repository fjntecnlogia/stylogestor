'use client'

import { useState } from 'react'

const MOCK_PRODUCTS = [
  { id: '1', name: 'Pomada modeladora',   sku: 'PM001', price: 35, cost: 18, stock: 12, minStock: 5,  category: 'Finalizador' },
  { id: '2', name: 'Shampoo profissional', sku: 'SH002', price: 45, cost: 22, stock: 3,  minStock: 5,  category: 'Lavagem'    },
  { id: '3', name: 'Óleo de barba',        sku: 'OB003', price: 55, cost: 28, stock: 8,  minStock: 3,  category: 'Barba'     },
  { id: '4', name: 'Condicionador',        sku: 'CD004', price: 38, cost: 19, stock: 15, minStock: 5,  category: 'Lavagem'   },
  { id: '5', name: 'Cera de cabelo',       sku: 'CE005', price: 30, cost: 14, stock: 2,  minStock: 5,  category: 'Finalizador'},
]

export function EstoqueView() {
  const [search, setSearch] = useState('')

  const filtered = MOCK_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search)
  )

  const lowStock = MOCK_PRODUCTS.filter((p) => p.stock <= p.minStock)

  return (
    <div className="space-y-4">
      {/* Alertas */}
      {lowStock.length > 0 && (
        <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-[#b07a10] text-sm">Estoque baixo em {lowStock.length} produto(s)</p>
            <p className="text-xs text-[#b07a10]/80 mt-0.5">{lowStock.map((p) => p.name).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex gap-3">
        <input type="text" placeholder="🔍 Buscar produto ou SKU..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white border border-[#E8E6E2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
        <button className="bg-[#1A3A6B] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#142d55] whitespace-nowrap">
          + Novo produto
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8F6F2] border-b border-[#E8E6E2]">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide">Produto</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide hidden md:table-cell">SKU</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide hidden md:table-cell">Preço venda</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide">Estoque</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E6E2]">
            {filtered.map((p) => {
              const low = p.stock <= p.minStock
              return (
                <tr key={p.id} className="hover:bg-[#F8F6F2] transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[#1C1C2E]">{p.name}</p>
                    <span className="text-[10px] bg-[#F8F6F2] px-1.5 py-0.5 rounded text-[#4A4A5A]">{p.category}</span>
                  </td>
                  <td className="px-3 py-3.5 text-[#4A4A5A] font-mono text-xs hidden md:table-cell">{p.sku}</td>
                  <td className="px-3 py-3.5 font-medium text-[#1B8A5A] hidden md:table-cell">R$ {p.price}</td>
                  <td className="px-3 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 font-bold text-sm px-2 py-0.5 rounded-lg ${
                      low ? 'bg-red-50 text-red-500' : 'bg-[#1B8A5A]/10 text-[#1B8A5A]'
                    }`}>
                      {low && '⚠️ '}{p.stock} un
                    </span>
                    <p className="text-[10px] text-[#4A4A5A] mt-0.5">mín: {p.minStock}</p>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button className="text-xs bg-[#1A3A6B]/10 text-[#1A3A6B] px-2 py-1 rounded-lg hover:bg-[#1A3A6B]/20">+ Entrada</button>
                      <button className="text-xs bg-[#E8E6E2] text-[#4A4A5A] px-2 py-1 rounded-lg hover:bg-[#d8d6d2]">✏️</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
