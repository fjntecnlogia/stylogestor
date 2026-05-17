'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

// Dados mock — conectar à API depois (mesmo shape do programa-fidelidade-view)
const MOCK_CLIENTES_FIDELIDADE = [
  { id: '1', name: 'Pedro Alves',     phone: '(11) 99999-0003', stamps: 8, points: 1380, tier: 'ouro',   totalVisits: 23, nextReward: 2,  memberSince: '2024-08-12' },
  { id: '2', name: 'Carlos Oliveira', phone: '(11) 99999-0001', stamps: 5, points: 720,  tier: 'prata',  totalVisits: 12, nextReward: 5,  memberSince: '2025-01-04' },
  { id: '3', name: 'André Lima',      phone: '(11) 99999-0005', stamps: 3, points: 480,  tier: 'bronze', totalVisits: 8,  nextReward: 7,  memberSince: '2025-06-20' },
  { id: '4', name: 'Rafael Santos',   phone: '(11) 99999-0002', stamps: 2, points: 200,  tier: 'bronze', totalVisits: 5,  nextReward: 8,  memberSince: '2025-09-10' },
  { id: '5', name: 'Lucas Ferreira',  phone: '(11) 99999-0004', stamps: 1, points: 120,  tier: 'bronze', totalVisits: 3,  nextReward: 9,  memberSince: '2025-12-01' },
  { id: '6', name: 'Bruno Carvalho',  phone: '(11) 99999-0006', stamps: 0, points: 40,   tier: 'bronze', totalVisits: 1,  nextReward: 10, memberSince: '2026-04-15' },
]

const TIER_CONFIG = {
  bronze: { label: 'Bronze', color: '#92400E', bg: '#FEF3C7', icon: '🥉' },
  prata:  { label: 'Prata',  color: '#374151', bg: '#F3F4F6', icon: '🥈' },
  ouro:   { label: 'Ouro',   color: '#92400E', bg: '#FEF9C3', icon: '🥇' },
  vip:    { label: 'VIP',    color: '#5B21B6', bg: '#EDE9FE', icon: '👑' },
}

const STAMPS_GOAL_DEFAULT = 10

// Histórico mock — conectar à API depois
const MOCK_HISTORICO = [
  { id: 'h1', tipo: 'carimbo',  data: '2026-05-10', descricao: 'Corte masculino + barba',     valor: 75 },
  { id: 'h2', tipo: 'carimbo',  data: '2026-04-22', descricao: 'Corte degradê',               valor: 50 },
  { id: 'h3', tipo: 'resgate',  data: '2026-04-05', descricao: 'Prêmio: 1 serviço grátis',    valor: 0 },
  { id: 'h4', tipo: 'carimbo',  data: '2026-03-18', descricao: 'Corte + sobrancelha',         valor: 65 },
  { id: 'h5', tipo: 'carimbo',  data: '2026-02-28', descricao: 'Corte masculino',             valor: 50 },
]

type HistoricoItem = (typeof MOCK_HISTORICO)[number]

export function FidelidadeView({ clientId }: { clientId: string }) {
  const clienteInicial = useMemo(
    () => MOCK_CLIENTES_FIDELIDADE.find((c) => c.id === clientId),
    [clientId],
  )

  const [cliente, setCliente] = useState(clienteInicial)
  const [historico, setHistorico] = useState<HistoricoItem[]>(MOCK_HISTORICO)
  const { success, error } = useToast()

  if (!cliente) {
    return (
      <div className="space-y-4">
        <Link
          href="/clientes"
          className="text-sm text-[#1A3A6B] font-semibold hover:underline"
        >
          ← Voltar para clientes
        </Link>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center shadow-sm">
          <p className="text-4xl mb-2">🔍</p>
          <h2 className="font-sora font-bold text-[#111827] text-lg">
            Cliente não encontrado
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            O cliente <span className="font-mono">{clientId}</span> não está no programa de fidelidade.
          </p>
        </div>
      </div>
    )
  }

  const tier = TIER_CONFIG[cliente.tier as keyof typeof TIER_CONFIG]
  const stampsGoal = STAMPS_GOAL_DEFAULT
  const progress = (cliente.stamps / stampsGoal) * 100
  const podeResgatar = cliente.stamps >= stampsGoal

  const handleDarCarimbo = () => {
    setCliente((c) =>
      c
        ? {
            ...c,
            stamps: Math.min(c.stamps + 1, stampsGoal),
            totalVisits: c.totalVisits + 1,
            nextReward: Math.max(c.nextReward - 1, 0),
          }
        : c,
    )
    setHistorico((h) => [
      {
        id: `h${Date.now()}`,
        tipo: 'carimbo',
        data: new Date().toISOString().slice(0, 10),
        descricao: 'Carimbo manual',
        valor: 0,
      },
      ...h,
    ])
    success('Carimbo adicionado! ✅')
  }

  const handleResgatar = () => {
    if (!podeResgatar) {
      error(`Faltam ${cliente.nextReward} visitas para o prêmio`)
      return
    }
    setCliente((c) => (c ? { ...c, stamps: 0, nextReward: stampsGoal } : c))
    setHistorico((h) => [
      {
        id: `h${Date.now()}`,
        tipo: 'resgate',
        data: new Date().toISOString().slice(0, 10),
        descricao: 'Prêmio: 1 serviço grátis',
        valor: 0,
      },
      ...h,
    ])
    success(`Prêmio resgatado para ${cliente.name}! 🎁`)
  }

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Oi ${cliente.name.split(' ')[0]}! Você tem ${cliente.stamps}/${stampsGoal} carimbos no nosso programa de fidelidade. Faltam só ${cliente.nextReward} visitas para o próximo prêmio! ✂️`,
    )
    window.open(`https://wa.me/55${cliente.phone.replace(/\D/g, '')}?text=${msg}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/clientes" className="text-[#6B7280] hover:text-[#1A3A6B]">
          Clientes
        </Link>
        <span className="text-[#D1D5DB]">/</span>
        <Link
          href={`/clientes/${cliente.id}`}
          className="text-[#6B7280] hover:text-[#1A3A6B]"
        >
          {cliente.name}
        </Link>
        <span className="text-[#D1D5DB]">/</span>
        <span className="text-[#111827] font-semibold">Fidelidade</span>
      </div>

      {/* Header com identificação do cliente */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white font-bold text-xl shrink-0">
            {cliente.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-sora font-bold text-[#111827] text-xl truncate">
                {cliente.name}
              </h2>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ color: tier.color, background: tier.bg }}
              >
                {tier.icon} {tier.label}
              </span>
            </div>
            <p className="text-sm text-[#6B7280] font-medium">
              {cliente.phone} · Membro desde{' '}
              {new Date(cliente.memberSince).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs do cliente */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Carimbos atuais', value: `${cliente.stamps}/${stampsGoal}`, icon: '🎫', color: '#1A3A6B' },
          { label: 'Pontos',          value: cliente.points.toLocaleString('pt-BR'), icon: '⭐', color: '#F5A623' },
          { label: 'Visitas totais',  value: String(cliente.totalVisits), icon: '🔄', color: '#1B8A5A' },
          { label: 'Faltam',          value: `${cliente.nextReward} visitas`, icon: '🎁', color: '#7C3AED' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{k.icon}</span>
            </div>
            <p className="font-sora font-bold text-2xl" style={{ color: k.color }}>
              {k.value}
            </p>
            <p className="text-xs text-[#6B7280] font-medium mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cartão de carimbos + ações */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-sora font-bold text-[#111827]">
                🎫 Cartão de fidelidade
              </h3>
              <span className="text-xs font-bold text-[#1A3A6B]">
                {podeResgatar ? '🎉 Prêmio disponível!' : `faltam ${cliente.nextReward} visitas`}
              </span>
            </div>

            {/* Barra de progresso */}
            <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-[#1A3A6B] to-[#F5A623] rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            {/* Carimbinhos visuais */}
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: stampsGoal }).map((_, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                    i < cliente.stamps
                      ? 'border-[#1A3A6B] bg-[#1A3A6B] text-white'
                      : 'border-[#D1D5DB] bg-white text-[#9CA3AF]'
                  }`}
                >
                  {i < cliente.stamps ? '✓' : i + 1}
                </div>
              ))}
            </div>

            {/* Ações */}
            <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex gap-2 flex-wrap">
              <button
                onClick={handleDarCarimbo}
                className="text-sm bg-[#1A3A6B] text-white font-semibold px-4 py-2 rounded-xl hover:bg-[#142d55] transition-colors"
              >
                ➕ Dar carimbo
              </button>
              <button
                onClick={handleResgatar}
                disabled={!podeResgatar}
                className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
                  podeResgatar
                    ? 'bg-[#1B8A5A]/10 text-[#1B8A5A] hover:bg-[#1B8A5A]/20'
                    : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                }`}
              >
                🎁 Resgatar prêmio
              </button>
              <button
                onClick={handleWhatsApp}
                className="text-sm bg-[#F5A623]/10 text-[#92400E] font-semibold px-4 py-2 rounded-xl hover:bg-[#F5A623]/20 transition-colors"
              >
                💬 Enviar WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
            <h3 className="font-sora font-bold text-[#111827] mb-3">📜 Histórico</h3>
            {historico.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Nenhum movimento registrado.</p>
            ) : (
              <ul className="space-y-3">
                {historico.slice(0, 8).map((h) => (
                  <li
                    key={h.id}
                    className="flex items-start gap-3 pb-3 border-b border-[#E5E7EB] last:border-0 last:pb-0"
                  >
                    <span className="text-lg shrink-0">
                      {h.tipo === 'resgate' ? '🎁' : '🎫'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">
                        {h.descricao}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {new Date(h.data).toLocaleDateString('pt-BR')}
                        {h.valor > 0 && ` · R$ ${h.valor.toFixed(2).replace('.', ',')}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
