'use client'

import { useState } from 'react'

// Mock data — conectar à API depois
const TENANTS = [
  { id: '1', name: 'Barbearia do João',    slug: 'joao-barber',  plan: 'PRO',     status: 'active',   mrr: 149, since: '01/03/2026', city: 'São Paulo',    clients: 148, appts: 312 },
  { id: '2', name: 'Studio Beleza & Cia',  slug: 'studio-beleza',plan: 'PREMIUM', status: 'active',   mrr: 249, since: '15/02/2026', city: 'Curitiba',     clients: 234, appts: 521 },
  { id: '3', name: 'Barber King',          slug: 'barber-king',  plan: 'STARTER', status: 'active',   mrr: 79,  since: '10/04/2026', city: 'BH',           clients: 67,  appts: 143 },
  { id: '4', name: 'Salão da Maria',       slug: 'salao-maria',  plan: 'PRO',     status: 'trial',    mrr: 0,   since: '05/05/2026', city: 'Recife',       clients: 12,  appts: 28  },
  { id: '5', name: 'Classic Barber Shop',  slug: 'classic-bs',   plan: 'PRO',     status: 'past_due', mrr: 149, since: '20/01/2026', city: 'Porto Alegre', clients: 89,  appts: 201 },
  { id: '6', name: 'Espaço Capilar',       slug: 'espaco-cap',   plan: 'STARTER', status: 'canceled', mrr: 0,   since: '01/01/2026', city: 'Fortaleza',    clients: 45,  appts: 98  },
]

const STATUS_TENANT = {
  active:   { label: 'Ativo',       cls: 'bg-[#D1FAE5] text-[#065F46]' },
  trial:    { label: 'Trial',       cls: 'bg-[#DBEAFE] text-[#1E40AF]' },
  past_due: { label: 'Inadimplente',cls: 'bg-[#FEE2E2] text-[#991B1B]' },
  canceled: { label: 'Cancelado',   cls: 'bg-[#F3F4F6] text-[#6B7280]' },
}

const PLAN_COLORS: Record<string, string> = {
  STARTER: '#6B7280', PRO: '#1A3A6B', PREMIUM: '#7C3AED',
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard',    icon: '📊' },
  { id: 'tenants',   label: 'Barbearias',   icon: '✂️' },
  { id: 'revenue',   label: 'Receita',      icon: '💰' },
  { id: 'support',   label: 'Suporte',      icon: '🎧' },
  { id: 'settings',  label: 'Configurações',icon: '⚙️' },
]

export function AdminDashboard() {
  const [page, setPage] = useState('dashboard')
  const [search, setSearch] = useState('')

  const active   = TENANTS.filter((t) => t.status === 'active')
  const trials   = TENANTS.filter((t) => t.status === 'trial')
  const pastDue  = TENANTS.filter((t) => t.status === 'past_due')
  const totalMRR = active.reduce((s, t) => s + t.mrr, 0) + pastDue.reduce((s, t) => s + t.mrr, 0)
  const filteredTenants = TENANTS.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <aside className="w-56 bg-[#0F172A] border-r border-white/5 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 bg-[#F5A623] rounded-lg flex items-center justify-center font-sora font-black text-[#1A3A6B] text-sm">S</div>
            <span className="font-sora font-extrabold text-white text-sm">STYLOGESTOR</span>
          </div>
          <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-widest">Admin SaaS</span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((item) => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                page === item.id ? 'bg-white/10 text-white font-semibold' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="bg-white/5 rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Logado como</p>
            <p className="text-xs font-semibold text-white">fjntecnologia2022</p>
            <p className="text-[10px] text-white/40">Super Admin</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-[#0F172A]">
        <div className="p-6 space-y-6">

          {/* ── DASHBOARD ── */}
          {page === 'dashboard' && (
            <>
              <div>
                <h1 className="font-sora font-bold text-2xl text-white">Visão geral do SaaS</h1>
                <p className="text-white/40 text-sm mt-0.5">Todos os dados em tempo real</p>
              </div>

              {/* KPIs principais */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'MRR',              value: `R$ ${totalMRR.toLocaleString()}`, sub: '+12% vs mês ant.', icon: '💰', color: '#1B8A5A' },
                  { label: 'ARR estimado',     value: `R$ ${(totalMRR * 12).toLocaleString()}`, sub: 'anualizado', icon: '📈', color: '#F5A623' },
                  { label: 'Tenants ativos',   value: active.length, sub: `${trials.length} em trial`, icon: '✂️', color: '#60A5FA' },
                  { label: 'Inadimplentes',    value: pastDue.length, sub: `R$ ${pastDue.reduce((s,t)=>s+t.mrr,0)} em risco`, icon: '⚠️', color: '#F87171' },
                ].map((k) => (
                  <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{k.icon}</span>
                      <span className="text-xs text-white/40 font-medium">{k.sub}</span>
                    </div>
                    <p className="font-sora font-extrabold text-2xl" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-xs text-white/40 font-medium mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Breakdown por plano */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h3 className="font-sora font-bold text-white mb-4">Distribuição por plano</h3>
                  {[
                    { plan: 'PREMIUM', count: TENANTS.filter(t=>t.plan==='PREMIUM'&&t.status==='active').length, mrr: TENANTS.filter(t=>t.plan==='PREMIUM'&&t.status==='active').reduce((s,t)=>s+t.mrr,0) },
                    { plan: 'PRO',     count: TENANTS.filter(t=>t.plan==='PRO'&&t.status==='active').length,     mrr: TENANTS.filter(t=>t.plan==='PRO'&&t.status==='active').reduce((s,t)=>s+t.mrr,0) },
                    { plan: 'STARTER', count: TENANTS.filter(t=>t.plan==='STARTER'&&t.status==='active').length, mrr: TENANTS.filter(t=>t.plan==='STARTER'&&t.status==='active').reduce((s,t)=>s+t.mrr,0) },
                  ].map((p) => (
                    <div key={p.plan} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PLAN_COLORS[p.plan] }} />
                        <span className="text-sm font-semibold text-white">{p.plan}</span>
                        <span className="text-xs text-white/40">{p.count} tenants</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: PLAN_COLORS[p.plan] }}>R$ {p.mrr}/mês</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h3 className="font-sora font-bold text-white mb-4">Últimos cadastros</h3>
                  <div className="space-y-3">
                    {TENANTS.slice(0,4).map((t) => {
                      const st = STATUS_TENANT[t.status as keyof typeof STATUS_TENANT]
                      return (
                        <div key={t.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{t.name}</p>
                              <p className="text-[10px] text-white/40">{t.city} · {t.since}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TENANTS ── */}
          {page === 'tenants' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-sora font-bold text-2xl text-white">Barbearias e Salões</h1>
                  <p className="text-white/40 text-sm mt-0.5">{TENANTS.length} tenants cadastrados</p>
                </div>
                <div className="flex gap-2">
                  <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20" />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Barbearia', 'Plano', 'Status', 'MRR', 'Clientes', 'Agend.', 'Cidade', 'Ações'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTenants.map((t) => {
                      const st = STATUS_TENANT[t.status as keyof typeof STATUS_TENANT]
                      return (
                        <tr key={t.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-white">{t.name}</p>
                            <p className="text-[10px] text-white/30">{t.slug}.stylogestor.com.br</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs font-bold px-2 py-1 rounded-full"
                              style={{ background: PLAN_COLORS[t.plan] + '22', color: PLAN_COLORS[t.plan] }}>
                              {t.plan}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3.5 font-bold" style={{ color: t.mrr > 0 ? '#1B8A5A' : '#6B7280' }}>
                            {t.mrr > 0 ? `R$ ${t.mrr}` : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-white/60">{t.clients}</td>
                          <td className="px-4 py-3.5 text-white/60">{t.appts}</td>
                          <td className="px-4 py-3.5 text-white/60">{t.city}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1">
                              <button className="text-[10px] bg-white/10 text-white px-2 py-1 rounded-lg hover:bg-white/20">
                                Ver
                              </button>
                              {t.status === 'past_due' && (
                                <button className="text-[10px] bg-[#FEE2E2] text-[#991B1B] px-2 py-1 rounded-lg font-bold">
                                  Cobrar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── RECEITA ── */}
          {page === 'revenue' && (
            <>
              <h1 className="font-sora font-bold text-2xl text-white">Receita do SaaS</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'MRR atual',     value: `R$ ${totalMRR}`,            sub: 'receita recorrente mensal' },
                  { label: 'ARR',           value: `R$ ${totalMRR * 12}`,       sub: 'receita anual recorrente' },
                  { label: 'Churn rate',    value: '5%',                         sub: '1 cancelamento este mês' },
                  { label: 'LTV médio',     value: 'R$ 2.682',                   sub: 'por tenant (18 meses)' },
                  { label: 'CAC estimado',  value: 'R$ 45',                      sub: 'custo de aquisição' },
                  { label: 'Payback',       value: '0,3 meses',                  sub: 'recuperação do CAC' },
                ].map((k) => (
                  <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <p className="text-xs text-white/40 font-semibold uppercase tracking-wide">{k.label}</p>
                    <p className="font-sora font-extrabold text-3xl text-white mt-2">{k.value}</p>
                    <p className="text-xs text-white/30 mt-1">{k.sub}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── SUPORTE ── */}
          {page === 'support' && (
            <>
              <h1 className="font-sora font-bold text-2xl text-white">Central de Suporte</h1>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-5xl mb-3">🎧</p>
                <p className="text-white font-semibold text-lg">Sistema de tickets em desenvolvimento</p>
                <p className="text-white/40 text-sm mt-1">Por enquanto, atendimento via WhatsApp e email</p>
                <div className="flex gap-3 justify-center mt-4">
                  <a href="https://wa.me/5565996952828" target="_blank"
                    className="bg-[#25D366] text-white font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90">
                    💬 WhatsApp
                  </a>
                  <a href="mailto:fjntecnologia2022@gmail.com"
                    className="bg-[#1A3A6B] text-white font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90">
                    📧 Email
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
