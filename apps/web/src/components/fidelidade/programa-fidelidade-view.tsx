'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/toast'
import { useTenantPersistedState } from '@/lib/tenant-storage'
import {
  getInitialClientesFidelidade,
  type ClienteFidelidadeFixture,
} from './__fixtures__/clientes-fidelidade'

interface FidelidadeConfig {
  tipo: 'carimbo' | 'pontos'
  stampsGoal: number
  reward: string
}

const DEFAULT_CONFIG: FidelidadeConfig = {
  tipo: 'carimbo',
  stampsGoal: 10,
  reward: '1 serviço grátis',
}

const TIER_CONFIG = {
  bronze: { label: 'Bronze', color: '#92400E', bg: '#FEF3C7', icon: '🥉' },
  prata:  { label: 'Prata',  color: '#374151', bg: '#F3F4F6', icon: '🥈' },
  ouro:   { label: 'Ouro',   color: '#92400E', bg: '#FEF9C3', icon: '🥇' },
  vip:    { label: 'VIP',    color: '#5B21B6', bg: '#EDE9FE', icon: '👑' },
}

export function ProgramaFidelidadeView() {
  // Config do programa persiste em localStorage scoped por tenant.
  // Lista de clientes idem (futuro CRUD → trocar por fetch).
  const [config, setConfig] = useTenantPersistedState<FidelidadeConfig>(
    'fidelidade:config',
    DEFAULT_CONFIG,
  )
  const [clients, setClients] = useTenantPersistedState<ClienteFidelidadeFixture[]>(
    'fidelidade:clients',
    getInitialClientesFidelidade(),
  )
  const [selected, setSelected] = useState<ClienteFidelidadeFixture | null>(null)
  const { success } = useToast()

  const { tipo, stampsGoal, reward } = config
  const setTipo = (v: 'carimbo' | 'pontos') => setConfig((c) => ({ ...c, tipo: v }))
  const setStampsGoal = (v: number) => setConfig((c) => ({ ...c, stampsGoal: v }))
  const setReward = (v: string) => setConfig((c) => ({ ...c, reward: v }))

  const handleDarCarimbo = (id: string) => {
    setClients(p => p.map(c => c.id === id ? { ...c, stamps: Math.min(c.stamps + 1, stampsGoal), totalVisits: c.totalVisits + 1, nextReward: Math.max(c.nextReward - 1, 0) } : c))
    success('Carimbo adicionado! ✅')
  }

  const handleResgatar = (id: string, name: string) => {
    setClients(p => p.map(c => c.id === id ? { ...c, stamps: 0, nextReward: stampsGoal } : c))
    success(`Prêmio resgatado para ${name}! 🎁`)
  }

  const handleWhatsApp = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Oi ${name.split(' ')[0]}! 🎂 Feliz aniversário! Temos um presente especial esperando por você na barbearia. Venha nos visitar! ✂️`)
    window.open(`https://wa.me/55${phone.replace(/\D/g,'')}?text=${msg}`, '_blank', 'noopener,noreferrer')
  }

  // O hook useTenantPersistedState já persiste a cada mudança — esse handler
  // só dispara o toast de confirmação visual pro usuário.
  const handleSalvarConfig = () => {
    success(`Programa salvo: ${tipo === 'carimbo' ? `${stampsGoal} visitas` : 'pontos'} → ${reward}`)
  }

  const aniversariantes = [
    { name: 'Carlos Oliveira', date: '15/05', phone: '(11) 99999-0001' },
    { name: 'André Lima',      date: '23/05', phone: '(11) 99999-0005' },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Clientes no programa', value: '6',    sub: '100% da base',   icon: '👥', color: '#1A3A6B' },
          { label: 'Prêmios dados este mês', value: '2',  sub: '2 cortes grátis', icon: '🎁', color: '#1B8A5A' },
          { label: 'Taxa de retorno',       value: '78%', sub: '+12% vs mês ant', icon: '🔄', color: '#F5A623' },
          { label: 'Clientes VIP/Ouro',     value: '1',   sub: 'Pedro Alves',     icon: '👑', color: '#7C3AED' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{k.icon}</span>
              <span className="text-xs font-semibold text-[#6B7280]">{k.sub}</span>
            </div>
            <p className="font-sora font-bold text-2xl" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-[#6B7280] font-medium mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuração do programa */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <h3 className="font-sora font-bold text-[#111827]">⚙️ Configurar programa</h3>

            <div>
              <label className="text-sm font-semibold text-[#111827] block mb-2">Tipo de fidelidade</label>
              <div className="grid grid-cols-2 gap-2">
                {(['carimbo', 'pontos'] as const).map((t) => (
                  <button key={t} onClick={() => setTipo(t)}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      tipo === t ? 'border-[#1A3A6B] bg-[#1A3A6B] text-white' : 'border-[#E5E7EB] text-[#374151] hover:border-[#1A3A6B]/40'
                    }`}>
                    {t === 'carimbo' ? '🎫 Carimbo' : '⭐ Pontos'}
                  </button>
                ))}
              </div>
            </div>

            {tipo === 'carimbo' && (
              <div>
                <label className="text-sm font-semibold text-[#111827] block mb-1.5">
                  Visitas para ganhar prêmio
                </label>
                <div className="flex items-center gap-3">
                  <input type="range" min="5" max="20" value={stampsGoal}
                    onChange={(e) => setStampsGoal(Number(e.target.value))}
                    className="flex-1 accent-[#1A3A6B]" />
                  <span className="font-bold text-[#1A3A6B] text-lg w-8 text-center">{stampsGoal}</span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">A cada {stampsGoal} visitas o cliente ganha:</p>
              </div>
            )}

            {tipo === 'pontos' && (
              <div className="bg-[#F0F4FF] rounded-xl p-3 text-sm text-[#374151]">
                <p className="font-semibold mb-1">Como funciona:</p>
                <p>• R$ 1 gasto = 1 ponto</p>
                <p>• 100 pontos = R$ 10 de desconto</p>
                <p>• Pontos nunca expiram</p>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-[#111827] block mb-1.5">Prêmio oferecido</label>
              <input value={reward} onChange={(e) => setReward(e.target.value)}
                className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2.5 text-sm text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] bg-white" />
            </div>

            <button onClick={handleSalvarConfig} className="w-full bg-[#1A3A6B] text-white font-bold py-2.5 rounded-xl hover:bg-[#142d55] text-sm transition-colors">
              Salvar configurações
            </button>
          </div>

          {/* Aniversariantes */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
            <h3 className="font-sora font-bold text-[#111827] mb-3">🎂 Aniversariantes do mês</h3>
            {aniversariantes.map((a) => (
              <div key={a.name} className="flex items-center justify-between py-2.5 border-b border-[#E5E7EB] last:border-0">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{a.name}</p>
                  <p className="text-xs text-[#6B7280]">{a.date}</p>
                </div>
                <button onClick={() => handleWhatsApp(a.phone, a.name)} className="text-xs bg-[#F5A623]/10 text-[#92400E] font-semibold px-2.5 py-1 rounded-lg hover:bg-[#F5A623]/20">
                  💬 Parabenizar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-sora font-bold text-[#111827]">Clientes no programa</h3>
          {clients.map((c) => {
            const tier = TIER_CONFIG[c.tier as keyof typeof TIER_CONFIG]
            const progress = (c.stamps / stampsGoal) * 100
            return (
              <div key={c.id}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
                className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all shadow-sm ${
                  selected?.id === c.id ? 'border-[#1A3A6B] ring-2 ring-[#1A3A6B]/20' : 'border-[#E5E7EB] hover:border-[#1A3A6B]/30'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white font-bold shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#111827] truncate">{c.name}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ color: tier.color, background: tier.bg }}>
                        {tier.icon} {tier.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] font-medium">{c.totalVisits} visitas · {c.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#1A3A6B]">{c.stamps}/{stampsGoal}</p>
                    <p className="text-xs text-[#6B7280]">carimbos</p>
                  </div>
                </div>

                {/* Barra de progresso dos carimbos */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#6B7280] font-medium">Progresso para o prêmio</span>
                    <span className="text-xs font-bold text-[#1A3A6B]">faltam {c.nextReward} visitas</span>
                  </div>
                  <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#1A3A6B] to-[#F5A623] rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  {/* Carimbinhos visuais */}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {Array.from({ length: stampsGoal }).map((_, i) => (
                      <div key={i}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] transition-all ${
                          i < c.stamps
                            ? 'border-[#1A3A6B] bg-[#1A3A6B] text-white'
                            : 'border-[#D1D5DB] bg-white text-[#9CA3AF]'
                        }`}>
                        {i < c.stamps ? '✓' : ''}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ações (quando selecionado) */}
                {selected?.id === c.id && (
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex gap-2 flex-wrap">
                    <button onClick={(e) => { e.stopPropagation(); handleDarCarimbo(c.id) }}
                      className="text-xs bg-[#1A3A6B] text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-[#142d55]">
                      ➕ Dar carimbo
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleResgatar(c.id, c.name) }}
                      className="text-xs bg-[#1B8A5A]/10 text-[#1B8A5A] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#1B8A5A]/20">
                      🎁 Resgatar prêmio
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleWhatsApp(c.phone, c.name) }}
                      className="text-xs bg-[#F5A623]/10 text-[#92400E] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#F5A623]/20">
                      💬 Enviar WhatsApp
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
