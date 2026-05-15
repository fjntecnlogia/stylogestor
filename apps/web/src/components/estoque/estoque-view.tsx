'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/toast'

const INITIAL_PRODUCTS = [
  { id: '1', name: 'Pomada modeladora',   sku: 'PM001', price: 35, cost: 18, stock: 12, minStock: 5,  category: 'Finalizador' },
  { id: '2', name: 'Shampoo profissional', sku: 'SH002', price: 45, cost: 22, stock: 3,  minStock: 5,  category: 'Lavagem'    },
  { id: '3', name: 'Óleo de barba',        sku: 'OB003', price: 55, cost: 28, stock: 8,  minStock: 3,  category: 'Barba'     },
  { id: '4', name: 'Condicionador',        sku: 'CD004', price: 38, cost: 19, stock: 15, minStock: 5,  category: 'Lavagem'   },
  { id: '5', name: 'Cera de cabelo',       sku: 'CE005', price: 30, cost: 14, stock: 2,  minStock: 5,  category: 'Finalizador'},
]

export function EstoqueView() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [entradaId, setEntradaId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [entradaQtd, setEntradaQtd] = useState(1)
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', price: 0, cost: 0, stock: 0, minStock: 5, category: 'Finalizador' })
  const [editProduct, setEditProduct] = useState({ name: '', price: 0, minStock: 0 })
  const { success } = useToast()

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search)
  )
  const lowStock = products.filter((p) => p.stock <= p.minStock)

  const handleEntrada = (id: string) => {
    if (entradaQtd <= 0) return
    setProducts(p => p.map(x => x.id === id ? { ...x, stock: x.stock + entradaQtd } : x))
    setEntradaId(null)
    setEntradaQtd(1)
    success(`Entrada de ${entradaQtd} unidade(s) registrada!`)
  }

  const handleEdit = (id: string) => {
    setProducts(p => p.map(x => x.id === id ? {
      ...x,
      name: editProduct.name || x.name,
      price: editProduct.price || x.price,
      minStock: editProduct.minStock || x.minStock,
    } : x))
    setEditId(null)
    success('Produto atualizado!')
  }

  const handleAdd = () => {
    if (!newProduct.name || !newProduct.sku) return
    setProducts(p => [...p, { ...newProduct, id: String(p.length + 1) }])
    setAdding(false)
    setNewProduct({ name: '', sku: '', price: 0, cost: 0, stock: 0, minStock: 5, category: 'Finalizador' })
    success('Produto cadastrado!')
  }

  return (
    <div className="space-y-4">
      {lowStock.length > 0 && (
        <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-[#b07a10] text-sm">Estoque baixo em {lowStock.length} produto(s)</p>
            <p className="text-xs text-[#b07a10]/80 mt-0.5">{lowStock.map((p) => p.name).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <input type="text" placeholder="🔍 Buscar produto ou SKU..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white border border-[#E8E6E2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
        <button onClick={() => setAdding(a => !a)}
          className="bg-[#1A3A6B] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#142d55] whitespace-nowrap">
          {adding ? '✕ Cancelar' : '+ Novo produto'}
        </button>
      </div>

      {/* Formulário novo produto */}
      {adding && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-5 space-y-3">
          <p className="font-semibold text-[#1A3A6B]">Novo produto</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-[#4A4A5A] mb-1 block">Nome</label>
              <input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="Nome do produto"
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="text-xs text-[#4A4A5A] mb-1 block">SKU</label>
              <input value={newProduct.sku} onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value }))} placeholder="EX001"
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="text-xs text-[#4A4A5A] mb-1 block">Preço venda (R$)</label>
              <input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: Number(e.target.value) }))}
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="text-xs text-[#4A4A5A] mb-1 block">Qtd. inicial</label>
              <input type="number" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: Number(e.target.value) }))}
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="text-xs text-[#4A4A5A] mb-1 block">Estoque mínimo</label>
              <input type="number" value={newProduct.minStock} onChange={e => setNewProduct(p => ({ ...p, minStock: Number(e.target.value) }))}
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
          </div>
          <button onClick={handleAdd} className="w-full bg-[#1A3A6B] text-white font-bold py-2.5 rounded-xl hover:bg-[#142d55]">
            Cadastrar produto
          </button>
        </div>
      )}

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
                <>
                  <tr key={p.id} className="hover:bg-[#F8F6F2] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#1C1C2E]">{p.name}</p>
                      <span className="text-[10px] bg-[#F8F6F2] px-1.5 py-0.5 rounded text-[#4A4A5A]">{p.category}</span>
                    </td>
                    <td className="px-3 py-3.5 text-[#4A4A5A] font-mono text-xs hidden md:table-cell">{p.sku}</td>
                    <td className="px-3 py-3.5 font-medium text-[#1B8A5A] hidden md:table-cell">R$ {p.price}</td>
                    <td className="px-3 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 font-bold text-sm px-2 py-0.5 rounded-lg ${low ? 'bg-red-50 text-red-500' : 'bg-[#1B8A5A]/10 text-[#1B8A5A]'}`}>
                        {low && '⚠️ '}{p.stock} un
                      </span>
                      <p className="text-[10px] text-[#4A4A5A] mt-0.5">mín: {p.minStock}</p>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEntradaId(entradaId === p.id ? null : p.id); setEntradaQtd(1) }}
                          className="text-xs bg-[#1A3A6B]/10 text-[#1A3A6B] px-2 py-1 rounded-lg hover:bg-[#1A3A6B]/20">+ Entrada</button>
                        <button onClick={() => { setEditId(editId === p.id ? null : p.id); setEditProduct({ name: p.name, price: p.price, minStock: p.minStock }) }}
                          className="text-xs bg-[#E8E6E2] text-[#4A4A5A] px-2 py-1 rounded-lg hover:bg-[#d8d6d2]">✏️</button>
                      </div>
                    </td>
                  </tr>
                  {entradaId === p.id && (
                    <tr key={`${p.id}-entrada`}>
                      <td colSpan={5} className="px-5 py-3 bg-[#EFF6FF] border-b border-[#BFDBFE]">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-[#1A3A6B] font-semibold">Registrar entrada:</span>
                          <input type="number" min="1" value={entradaQtd} onChange={e => setEntradaQtd(Number(e.target.value))}
                            className="w-20 border border-[#BFDBFE] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
                          <span className="text-sm text-[#4A4A5A]">unidades</span>
                          <button onClick={() => handleEntrada(p.id)} className="bg-[#1A3A6B] text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-[#142d55]">Confirmar</button>
                          <button onClick={() => setEntradaId(null)} className="text-xs text-[#4A4A5A] hover:text-[#1C1C2E]">Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {editId === p.id && (
                    <tr key={`${p.id}-edit`}>
                      <td colSpan={5} className="px-5 py-3 bg-[#F8F6F2] border-b border-[#E8E6E2]">
                        <div className="flex items-center gap-3 flex-wrap">
                          <input value={editProduct.name} onChange={e => setEditProduct(f => ({ ...f, name: e.target.value }))} placeholder="Nome"
                            className="border border-[#E8E6E2] rounded-lg px-2 py-1 text-sm focus:outline-none" />
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[#4A4A5A]">Preço R$</span>
                            <input type="number" value={editProduct.price} onChange={e => setEditProduct(f => ({ ...f, price: Number(e.target.value) }))}
                              className="w-20 border border-[#E8E6E2] rounded-lg px-2 py-1 text-sm focus:outline-none" />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[#4A4A5A]">Mín.</span>
                            <input type="number" value={editProduct.minStock} onChange={e => setEditProduct(f => ({ ...f, minStock: Number(e.target.value) }))}
                              className="w-16 border border-[#E8E6E2] rounded-lg px-2 py-1 text-sm focus:outline-none" />
                          </div>
                          <button onClick={() => handleEdit(p.id)} className="bg-[#1B8A5A] text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-[#156b47]">Salvar</button>
                          <button onClick={() => setEditId(null)} className="text-xs text-[#4A4A5A] hover:text-[#1C1C2E]">Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
