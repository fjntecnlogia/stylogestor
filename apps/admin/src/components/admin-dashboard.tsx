'use client'

import { useState } from 'react'

const TENANTS = [
  { id: '1', name: 'Barbearia do João',    slug: 'joao-barber',   plan: 'PRO',     status: 'active',   mrr: 149, since: '01/03/2026', city: 'São Paulo',    clients: 148, appts: 312, lastLogin: '11/05/2026' },
  { id: '2', name: 'Studio Beleza & Cia',  slug: 'studio-beleza', plan: 'PREMIUM', status: 'active',   mrr: 249, since: '15/02/2026', city: 'Curitiba',     clients: 234, appts: 521, lastLogin: '11/05/2026' },
  { id: '3', name: 'Barber King',          slug: 'barber-king',   plan: 'STARTER', status: 'active',   mrr: 79,  since: '10/04/2026', city: 'BH',           clients: 67,  appts: 143, lastLogin: '10/05/2026' },
  { id: '4', name: 'Salão da Maria',       slug: 'salao-maria',   plan: 'PRO',     status: 'trial',    mrr: 0,   since: '05/05/2026', city: 'Recife',       clients: 12,  appts: 28,  lastLogin: '11/05/2026' },
  { id: '5', name: 'Classic Barber Shop',  slug: 'classic-bs',    plan: 'PRO',     status: 'past_due', mrr: 149, since: '20/01/2026', city: 'Porto Alegre', clients: 89,  appts: 201, lastLogin: '08/05/2026' },
  { id: '6', name: 'Espaço Capilar',       slug: 'espaco-cap',    plan: 'STARTER', status: 'canceled', mrr: 0,   since: '01/01/2026', city: 'Fortaleza',    clients: 45,  appts: 98,  lastLogin: '01/04/2026' },
]

const TICKETS = [
  { id: '1', tenant: 'Barbearia do João',    tipo: 'suporte',    titulo: 'Agendamento duplicado',             status: 'aberto',      data: '11/05/2026', prioridade: 'alta' },
  { id: '2', tenant: 'Studio Beleza & Cia',  tipo: 'elogio',     titulo: 'Suporte incrível!',                 status: 'resolvido',   data: '10/05/2026', prioridade: 'baixa' },
  { id: '3', tenant: 'Barber King',          tipo: 'reclamacao', titulo: 'WhatsApp não enviando lembretes',   status: 'andamento',   data: '09/05/2026', prioridade: 'alta' },
  { id: '4', tenant: 'Salão da Maria',       tipo: 'sugestao',   titulo: 'Adicionar relatório semanal',       status: 'aberto',      data: '08/05/2026', prioridade: 'media' },
  { id: '5', tenant: 'Classic Barber Shop',  tipo: 'suporte',    titulo: 'Erro ao fechar caixa',              status: 'andamento',   data: '07/05/2026', prioridade: 'alta' },
]

const ANALYTICS = {
  pageViews: [420, 380, 510, 490, 620, 580, 710, 680, 750, 820, 790, 940, 1020, 980],
  signups: [2, 1, 3, 2, 4, 2, 3, 5, 3, 4, 6, 4, 5, 7],
  days: ['29/04','30/04','01/05','02/05','03/05','04/05','05/05','06/05','07/05','08/05','09/05','10/05','11/05'],
}

const STATUS_TENANT = {
  active:   { label: 'Ativo',        cls: 'bg-[#D1FAE5] text-[#065F46]' },
  trial:    { label: 'Trial',        cls: 'bg-[#DBEAFE] text-[#1E40AF]' },
  past_due: { label: 'Inadimplente', cls: 'bg-[#FEE2E2] text-[#991B1B]' },
  canceled: { label: 'Cancelado',    cls: 'bg-[#F3F4F6] text-[#6B7280]' },
}

const STATUS_TICKET = {
  aberto:    { label: 'Aberto',      cls: 'bg-[#FEF9C3] text-[#92400E]' },
  andamento: { label: 'Em andamento',cls: 'bg-[#DBEAFE] text-[#1E40AF]' },
  resolvido: { label: 'Resolvido',   cls: 'bg-[#D1FAE5] text-[#065F46]' },
}

const TIPO_TICKET = {
  suporte:    { icon: '🎧', label: 'Suporte',    color: '#3B82F6' },
  elogio:     { icon: '⭐', label: 'Elogio',     color: '#10B981' },
  reclamacao: { icon: '⚠️', label: 'Reclamação', color: '#EF4444' },
  sugestao:   { icon: '💡', label: 'Sugestão',   color: '#F59E0B' },
}

const PLAN_COLORS: Record<string, string> = { STARTER: '#6B7280', PRO: '#1A3A6B', PREMIUM: '#7C3AED' }

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',    icon: '📊' },
  { id: 'analytics',  label: 'Analytics',    icon: '📈' },
  { id: 'tenants',    label: 'Barbearias',   icon: '✂️' },
  { id: 'tickets',    label: 'Suporte',      icon: '🎧' },
  { id: 'revenue',    label: 'Receita',      icon: '💰' },
  { id: 'settings',   label: 'Configurações',icon: '⚙️' },
]

export function AdminDashboard() {
  const [page, setPage] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [ticketFiltro, setTicketFiltro] = useState<'todos' | 'aberto' | 'andamento' | 'resolvido'>('todos')
  const [selectedTicket, setSelectedTicket] = useState<typeof TICKETS[0] | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<typeof TENANTS[0] | null>(null)
  const [resposta, setResposta] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cobrancaEnviada, setCobrancaEnviada] = useState<string | null>(null)

  const active   = TENANTS.filter((t) => t.status === 'active')
  const trials   = TENANTS.filter((t) => t.status === 'trial')
  const pastDue  = TENANTS.filter((t) => t.status === 'past_due')
  const totalMRR = [...active, ...pastDue].reduce((s, t) => s + t.mrr, 0)
  const totalClients = TENANTS.reduce((s, t) => s + t.clients, 0)
  const totalAppts = TENANTS.reduce((s, t) => s + t.appts, 0)

  const filteredTenants = TENANTS.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.city.toLowerCase().includes(search.toLowerCase())
  )

  const filteredTickets = TICKETS.filter((t) =>
    ticketFiltro === 'todos' || t.status === ticketFiltro
  )

  const ticketsAbertos = TICKETS.filter((t) => t.status === 'aberto').length

  const maxPageView = Math.max(...ANALYTICS.pageViews)

  const handleNav = (id: string) => { setPage(id); setSidebarOpen(false) }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A]">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        w-56 bg-[#0F172A] border-r border-white/5 flex flex-col shrink-0
        fixed lg:sticky top-0 h-screen z-40 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-5 py-5 border-b border-white/5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-7 h-7 bg-[#F5A623] rounded-lg flex items-center justify-center font-sora font-black text-[#1A3A6B] text-sm">S</div>
              <span className="font-sora font-extrabold text-white text-sm">STYLOGESTOR</span>
            </div>
            <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-widest">Admin SaaS</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white text-lg mt-0.5">✕</button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <button key={item.id} onClick={() => handleNav(item.id)}
              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                page === item.id ? 'bg-white/10 text-white font-semibold' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'tickets' && ticketsAbertos > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{ticketsAbertos}</span>
              )}
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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="block w-5 h-0.5 bg-white rounded" />
            <span className="block w-5 h-0.5 bg-white rounded" />
            <span className="block w-5 h-0.5 bg-white rounded" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#F5A623] rounded flex items-center justify-center font-sora font-black text-[#1A3A6B] text-xs">S</div>
            <span className="font-sora font-extrabold text-white text-sm">STYLOGESTOR <span className="text-[#F5A623] text-[10px]">ADMIN</span></span>
          </div>
          {ticketsAbertos > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{ticketsAbertos} aberto{ticketsAbertos > 1 ? 's' : ''}</span>
          )}
        </div>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-6">

          {/* ── DASHBOARD ── */}
          {page === 'dashboard' && (
            <>
              <div>
                <h1 className="font-sora font-bold text-2xl text-white">Visão geral do SaaS</h1>
                <p className="text-white/40 text-sm mt-0.5">Todos os dados em tempo real — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                {[
                  { label: 'MRR',              value: `R$ ${totalMRR.toLocaleString()}`, sub: '+12% vs mês ant.', icon: '💰', color: '#1B8A5A' },
                  { label: 'Tenants ativos',   value: active.length,                    sub: `${trials.length} em trial`, icon: '✂️', color: '#60A5FA' },
                  { label: 'Total de clientes',value: totalClients.toLocaleString(),     sub: 'em todas barbearias', icon: '👥', color: '#F5A623' },
                  { label: 'Atendimentos',     value: totalAppts.toLocaleString(),       sub: 'este mês', icon: '📅', color: '#A78BFA' },
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

              {/* Tickets e Tenants recentes lado a lado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tickets abertos */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-sora font-bold text-white">🎧 Tickets recentes</h3>
                    <button onClick={() => setPage('tickets')} className="text-xs text-[#F5A623] hover:underline">Ver todos →</button>
                  </div>
                  <div className="space-y-3">
                    {TICKETS.filter(t => t.status !== 'resolvido').slice(0,4).map((t) => {
                      const tipo = TIPO_TICKET[t.tipo as keyof typeof TIPO_TICKET]
                      const st = STATUS_TICKET[t.status as keyof typeof STATUS_TICKET]
                      return (
                        <div key={t.id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-xl p-2 -mx-2 transition-colors" onClick={() => { setPage('tickets'); setSelectedTicket(t) }}>
                          <span className="text-xl">{tipo.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{t.titulo}</p>
                            <p className="text-xs text-white/40">{t.tenant} · {t.data}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>{st.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Últimos cadastros */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-sora font-bold text-white">✂️ Últimos cadastros</h3>
                    <button onClick={() => setPage('tenants')} className="text-xs text-[#F5A623] hover:underline">Ver todos →</button>
                  </div>
                  <div className="space-y-3">
                    {TENANTS.slice(0,5).map((t) => {
                      const st = STATUS_TENANT[t.status as keyof typeof STATUS_TENANT]
                      return (
                        <div key={t.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-white">{t.name.charAt(0)}</div>
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

          {/* ── ANALYTICS ── */}
          {page === 'analytics' && (
            <>
              <div>
                <h1 className="font-sora font-bold text-2xl text-white">Analytics do SaaS</h1>
                <p className="text-white/40 text-sm mt-0.5">Métricas de acesso, cadastros e engajamento</p>
              </div>

              {/* KPIs analytics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Visitas hoje',          value: '1.020',  sub: '▲ 5% vs ontem',     icon: '👁️',  color: '#60A5FA' },
                  { label: 'Cadastros esta semana',  value: '7',      sub: '▲ 40% vs semana ant',icon: '🆕',  color: '#1B8A5A' },
                  { label: 'Taxa de conversão',      value: '3,2%',   sub: 'trial → pago',       icon: '🎯',  color: '#F5A623' },
                  { label: 'Churn rate',             value: '4,8%',   sub: '▼ 0,5% vs mês ant',  icon: '📉',  color: '#F87171' },
                ].map((k) => (
                  <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{k.icon}</span>
                      <span className="text-xs text-white/40">{k.sub}</span>
                    </div>
                    <p className="font-sora font-extrabold text-2xl" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-xs text-white/40 mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Gráfico de visitas (barras) */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-sora font-bold text-white">Visitas ao site (últimos 13 dias)</h3>
                  <span className="text-xs text-white/40 bg-white/5 px-3 py-1 rounded-full">stylogestor.com.br</span>
                </div>
                <div className="flex items-end gap-2 h-40">
                  {ANALYTICS.pageViews.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-white/30">{v}</span>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-[#1A3A6B] to-[#3B82F6] transition-all hover:opacity-80"
                        style={{ height: `${(v / maxPageView) * 100}%`, minHeight: '4px' }}
                        title={`${ANALYTICS.days[i]}: ${v} visitas`}
                      />
                      <span className="text-[8px] text-white/30 rotate-45 origin-left mt-1 hidden md:block">
                        {ANALYTICS.days[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gráfico de cadastros */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-sora font-bold text-white mb-4">Novos cadastros por dia</h3>
                  <div className="flex items-end gap-2 h-24">
                    {ANALYTICS.signups.map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-white/40">{v}</span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-[#1B8A5A] to-[#34D399]"
                          style={{ height: `${(v / Math.max(...ANALYTICS.signups)) * 100}%`, minHeight: '4px' }}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/30 mt-3">Total no período: {ANALYTICS.signups.reduce((s, v) => s + v, 0)} cadastros</p>
                </div>

                {/* Distribuição por plano */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-sora font-bold text-white mb-4">Distribuição por plano</h3>
                  <div className="space-y-3">
                    {[
                      { plan: 'PREMIUM', count: 1, pct: 17 },
                      { plan: 'PRO',     count: 3, pct: 50 },
                      { plan: 'STARTER', count: 2, pct: 33 },
                    ].map((p) => (
                      <div key={p.plan}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-white">{p.plan}</span>
                          <span className="text-white/40">{p.count} tenants · {p.pct}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: PLAN_COLORS[p.plan] }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/40 mb-2">Páginas mais acessadas</p>
                    {[
                      { page: '/login',     views: 324, pct: 85 },
                      { page: '/agenda',    views: 289, pct: 76 },
                      { page: '/clientes',  views: 201, pct: 53 },
                      { page: '/financeiro',views: 156, pct: 41 },
                    ].map((p) => (
                      <div key={p.page} className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-white/60 w-28 font-mono">{p.page}</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#F5A623] rounded-full" style={{ width: `${p.pct}%` }} />
                        </div>
                        <span className="text-[10px] text-white/40 w-8 text-right">{p.views}</span>
                      </div>
                    ))}
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
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20" />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Barbearia','Plano','Status','MRR','Clientes','Agend.','Último login','Ações'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide whitespace-nowrap">{h}</th>
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
                            <p className="text-[10px] text-white/30">{t.slug}.stylogestor.com.br · {t.city}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: PLAN_COLORS[t.plan] + '22', color: PLAN_COLORS[t.plan] }}>{t.plan}</span>
                          </td>
                          <td className="px-4 py-3.5"><span className={`text-xs font-bold px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span></td>
                          <td className="px-4 py-3.5 font-bold" style={{ color: t.mrr > 0 ? '#1B8A5A' : '#6B7280' }}>{t.mrr > 0 ? `R$ ${t.mrr}` : '—'}</td>
                          <td className="px-4 py-3.5 text-white/60">{t.clients}</td>
                          <td className="px-4 py-3.5 text-white/60">{t.appts}</td>
                          <td className="px-4 py-3.5 text-white/40 text-xs">{t.lastLogin}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setSelectedTenant(t); setPage('tenant-detail') }}
                                className="text-[10px] bg-white/10 text-white px-2 py-1 rounded-lg hover:bg-white/20 transition-colors"
                              >Ver</button>
                              {t.status === 'past_due' && (
                                <button
                                  onClick={() => {
                                    setCobrancaEnviada(t.id)
                                    setTimeout(() => setCobrancaEnviada(null), 3000)
                                  }}
                                  className="text-[10px] bg-[#FEE2E2] text-[#991B1B] px-2 py-1 rounded-lg font-bold hover:bg-[#FECACA] transition-colors"
                                >
                                  {cobrancaEnviada === t.id ? '✓ Enviado' : 'Cobrar'}
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

          {/* ── DETALHE DO TENANT ── */}
          {page === 'tenant-detail' && selectedTenant && (() => {
            const t = selectedTenant
            const st = STATUS_TENANT[t.status as keyof typeof STATUS_TENANT]
            const tenantTickets = TICKETS.filter((tk) => tk.tenant === t.name)
            return (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => { setPage('tenants'); setSelectedTenant(null) }}
                    className="text-white/50 hover:text-white text-sm transition-colors"
                  >← Voltar</button>
                  <h1 className="font-sora font-bold text-2xl text-white">{t.name}</h1>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Plano', value: t.plan, color: PLAN_COLORS[t.plan] },
                    { label: 'MRR', value: t.mrr > 0 ? `R$ ${t.mrr}` : '—', color: '#1B8A5A' },
                    { label: 'Clientes', value: t.clients, color: '#60A5FA' },
                    { label: 'Agendamentos', value: t.appts, color: '#F5A623' },
                  ].map((k) => (
                    <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wide">{k.label}</p>
                      <p className="font-sora font-extrabold text-2xl mt-1" style={{ color: k.color }}>{k.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Informações */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                    <p className="font-sora font-bold text-white">Informações</p>
                    {[
                      { label: 'Slug / Link', value: `${t.slug}.stylogestor.com.br` },
                      { label: 'Cidade', value: t.city },
                      { label: 'Cliente desde', value: t.since },
                      { label: 'Último login', value: t.lastLogin },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between text-sm border-b border-white/5 pb-2">
                        <span className="text-white/40">{r.label}</span>
                        <span className="text-white font-medium">{r.value}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <a
                        href={`https://${t.slug}.stylogestor.com.br`}
                        target="_blank"
                        className="flex-1 text-center text-xs bg-white/10 text-white py-2 rounded-xl hover:bg-white/20 transition-colors"
                      >
                        🔗 Ver agendamento
                      </a>
                      {t.status === 'past_due' && (
                        <button
                          onClick={() => setCobrancaEnviada(t.id)}
                          className="flex-1 text-xs bg-[#FEE2E2] text-[#991B1B] font-bold py-2 rounded-xl hover:bg-[#FECACA] transition-colors"
                        >
                          💳 Enviar cobrança
                        </button>
                      )}
                      {t.status === 'canceled' && (
                        <button className="flex-1 text-xs bg-[#1B8A5A] text-white font-bold py-2 rounded-xl hover:bg-[#156b47] transition-colors">
                          🔄 Reativar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tickets deste tenant */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10">
                      <p className="font-sora font-bold text-white">Chamados de suporte</p>
                    </div>
                    {tenantTickets.length === 0 ? (
                      <div className="p-6 text-center text-white/30 text-sm">Nenhum chamado aberto</div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {tenantTickets.map((tk) => {
                          const stk = STATUS_TICKET[tk.status as keyof typeof STATUS_TICKET]
                          const tipo = TIPO_TICKET[tk.tipo as keyof typeof TIPO_TICKET]
                          return (
                            <div key={tk.id} className="px-5 py-3 flex items-center gap-3">
                              <span>{tipo.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">{tk.titulo}</p>
                                <p className="text-xs text-white/30">{tk.data} · {tk.prioridade}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stk.cls}`}>{stk.label}</span>
                              <button
                                onClick={() => { setSelectedTicket(tk); setPage('tickets') }}
                                className="text-[10px] bg-white/10 text-white px-2 py-1 rounded-lg hover:bg-white/20"
                              >Ver</button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações administrativas */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <p className="font-sora font-bold text-white mb-3">Ações administrativas</p>
                  <div className="flex flex-wrap gap-2">
                    <button className="text-xs bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors">📧 Enviar e-mail</button>
                    <button className="text-xs bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors">💬 Abrir WhatsApp</button>
                    <button className="text-xs bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors">🔑 Acessar painel</button>
                    <button className="text-xs bg-[#FEE2E2] text-[#991B1B] px-4 py-2 rounded-xl hover:bg-[#FECACA] font-bold transition-colors">⛔ Suspender conta</button>
                  </div>
                </div>
              </>
            )
          })()}

          {/* ── TICKETS / SUPORTE ── */}
          {page === 'tickets' && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="font-sora font-bold text-2xl text-white">Central de Suporte</h1>
                  <p className="text-white/40 text-sm mt-0.5">{ticketsAbertos} tickets aguardando resposta</p>
                </div>
                <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                  {(['todos','aberto','andamento','resolvido'] as const).map((f) => (
                    <button key={f} onClick={() => setTicketFiltro(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${ticketFiltro === f ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                      {f === 'todos' ? 'Todos' : f === 'andamento' ? 'Em andamento' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Lista de tickets */}
                <div className="lg:col-span-2 space-y-3">
                  {filteredTickets.map((t) => {
                    const tipo = TIPO_TICKET[t.tipo as keyof typeof TIPO_TICKET]
                    const st = STATUS_TICKET[t.status as keyof typeof STATUS_TICKET]
                    const prioColor = t.prioridade === 'alta' ? '#F87171' : t.prioridade === 'media' ? '#FCD34D' : '#6EE7B7'
                    return (
                      <div key={t.id} onClick={() => setSelectedTicket(selectedTicket?.id === t.id ? null : t)}
                        className={`bg-white/5 border rounded-2xl p-5 cursor-pointer transition-all hover:bg-white/8 ${selectedTicket?.id === t.id ? 'border-[#F5A623]/50 bg-white/8' : 'border-white/10'}`}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl shrink-0">{tipo.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-white">{t.titulo}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: prioColor + '22', color: prioColor }}>
                                {t.prioridade}
                              </span>
                            </div>
                            <p className="text-xs text-white/40 mt-1">{t.tenant} · {tipo.label} · {t.data}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {filteredTickets.length === 0 && (
                    <div className="text-center py-12 text-white/30">
                      <p className="text-4xl mb-2">🎉</p>
                      <p className="font-semibold">Nenhum ticket neste filtro</p>
                    </div>
                  )}
                </div>

                {/* Detalhe do ticket */}
                <div>
                  {selectedTicket ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 sticky top-6">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{TIPO_TICKET[selectedTicket.tipo as keyof typeof TIPO_TICKET].icon}</span>
                        <div>
                          <p className="font-sora font-bold text-white">{selectedTicket.titulo}</p>
                          <p className="text-xs text-white/40 mt-0.5">{selectedTicket.tenant}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: 'Tipo', value: TIPO_TICKET[selectedTicket.tipo as keyof typeof TIPO_TICKET].label },
                          { label: 'Status', value: STATUS_TICKET[selectedTicket.status as keyof typeof STATUS_TICKET].label },
                          { label: 'Prioridade', value: selectedTicket.prioridade },
                          { label: 'Data', value: selectedTicket.data },
                        ].map((i) => (
                          <div key={i.label} className="bg-white/5 rounded-xl p-2.5">
                            <p className="text-white/30 uppercase tracking-wide text-[9px]">{i.label}</p>
                            <p className="text-white font-semibold mt-0.5">{i.value}</p>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="text-xs text-white/40 block mb-1.5">Responder ao cliente</label>
                        <textarea value={resposta} onChange={(e) => setResposta(e.target.value)}
                          placeholder="Digite sua resposta..."
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#F5A623]/50 resize-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 bg-[#1B8A5A] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#156b47]">
                          ✓ Responder e Resolver
                        </button>
                        <button className="flex-1 border border-white/10 text-white/60 text-xs font-semibold py-2.5 rounded-xl hover:bg-white/5">
                          📋 Assumir
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white/30">
                      <p className="text-4xl mb-2">👈</p>
                      <p className="font-semibold text-sm">Selecione um ticket para ver os detalhes e responder</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── RECEITA / FINANCEIRO STRIPE ── */}
          {page === 'revenue' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-sora font-bold text-2xl text-white">Financeiro · Stripe</h1>
                  <p className="text-white/40 text-sm mt-0.5">Receita, assinaturas e pagamentos em tempo real</p>
                </div>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  className="text-xs bg-[#F5A623] text-[#1A3A6B] font-bold px-4 py-2 rounded-xl hover:bg-[#e09610] transition-colors self-start sm:self-auto"
                >
                  Abrir Stripe Dashboard →
                </a>
              </div>

              {/* KPIs financeiros */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'MRR atual',     value: `R$ ${totalMRR.toLocaleString('pt-BR')}`, sub: 'receita recorrente mensal', color: '#1B8A5A' },
                  { label: 'ARR',           value: `R$ ${(totalMRR * 12).toLocaleString('pt-BR')}`, sub: 'receita anual projetada', color: '#60A5FA' },
                  { label: 'Churn rate',    value: '4,8%', sub: '1 cancelamento este mês', color: '#EF4444' },
                  { label: 'LTV médio',     value: 'R$ 2.682', sub: 'por tenant (18 meses)', color: '#F5A623' },
                  { label: 'CAC estimado',  value: 'R$ 45',    sub: 'custo de aquisição', color: '#A78BFA' },
                  { label: 'Payback',       value: '0,3 meses', sub: 'recuperação do CAC', color: '#34D399' },
                ].map((k) => (
                  <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wide">{k.label}</p>
                    <p className="font-sora font-extrabold text-2xl mt-1" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Receita por plano */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <p className="font-sora font-bold text-white">Receita por plano</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { plan: 'Premium', tenants: 1, mrr: 249,  color: '#7C3AED' },
                    { plan: 'Pro',     tenants: 2, mrr: 298,  color: '#1A3A6B' },
                    { plan: 'Starter', tenants: 2, mrr: 79,   color: '#6B7280' },
                  ].map((p) => {
                    const pct = Math.round((p.mrr / totalMRR) * 100)
                    return (
                      <div key={p.plan}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white font-semibold">{p.plan} <span className="text-white/40 font-normal text-xs">({p.tenants} tenants)</span></span>
                          <span className="font-bold" style={{ color: p.color }}>R$ {p.mrr}/mês · {pct}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: p.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Pagamentos recentes */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <p className="font-sora font-bold text-white">Pagamentos recentes</p>
                  <span className="text-xs text-white/40">Via Stripe</span>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    { tenant: 'Studio Beleza & Cia', plan: 'Premium', valor: 249, status: 'pago',     data: '10/05/2026', metodo: 'Cartão •••• 4242' },
                    { tenant: 'Barbearia do João',   plan: 'Pro',     valor: 149, status: 'pago',     data: '08/05/2026', metodo: 'Cartão •••• 1234' },
                    { tenant: 'Barber King',          plan: 'Starter', valor: 79,  status: 'pago',     data: '07/05/2026', metodo: 'Boleto' },
                    { tenant: 'Classic Barber Shop',  plan: 'Pro',     valor: 149, status: 'falhou',   data: '05/05/2026', metodo: 'Cartão •••• 0000' },
                    { tenant: 'Espaço Capilar',       plan: 'Starter', valor: 79,  status: 'cancelado',data: '01/04/2026', metodo: 'Cartão •••• 5678' },
                  ].map((p, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{p.tenant}</p>
                        <p className="text-xs text-white/40">{p.metodo} · {p.data}</p>
                      </div>
                      <span className="text-xs text-white/40 hidden sm:block">{p.plan}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        p.status === 'pago' ? 'bg-[#D1FAE5] text-[#065F46]' :
                        p.status === 'falhou' ? 'bg-[#FEE2E2] text-[#991B1B]' :
                        'bg-[#F3F4F6] text-[#6B7280]'
                      }`}>
                        {p.status === 'pago' ? '✓ Pago' : p.status === 'falhou' ? '✗ Falhou' : 'Cancelado'}
                      </span>
                      <span className={`font-bold text-sm w-16 text-right ${p.status === 'pago' ? 'text-[#1B8A5A]' : 'text-white/30 line-through'}`}>
                        R$ {p.valor}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assinaturas por status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Ativas',       count: 3, valor: 477,  color: '#1B8A5A', bg: 'bg-[#D1FAE5]/10 border-[#1B8A5A]/20' },
                  { label: 'Em trial',     count: 1, valor: 0,    color: '#60A5FA', bg: 'bg-[#DBEAFE]/10 border-[#60A5FA]/20' },
                  { label: 'Inadimplente', count: 1, valor: 149,  color: '#EF4444', bg: 'bg-[#FEE2E2]/10 border-[#EF4444]/20' },
                ].map((s) => (
                  <div key={s.label} className={`border rounded-2xl p-5 ${s.bg}`}>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-wide">{s.label}</p>
                    <p className="font-sora font-extrabold text-3xl mt-1" style={{ color: s.color }}>{s.count}</p>
                    {s.valor > 0 && <p className="text-xs text-white/30 mt-0.5">R$ {s.valor}/mês em risco</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── CONFIGURAÇÕES ── */}
          {page === 'settings' && (
            <>
              <h1 className="font-sora font-bold text-2xl text-white">Configurações do SaaS</h1>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-sora font-bold text-white">Planos e preços</h3>
                  {[
                    { plan: 'Starter', price: 'R$ 79/mês', profis: '1 profissional' },
                    { plan: 'Pro',     price: 'R$ 149/mês', profis: '5 profissionais' },
                    { plan: 'Premium', price: 'R$ 249/mês', profis: 'Ilimitado' },
                  ].map((p) => (
                    <div key={p.plan} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <p className="font-semibold text-white">{p.plan}</p>
                        <p className="text-xs text-white/40">{p.profis}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#F5A623] font-bold">{p.price}</span>
                        <button className="text-xs bg-white/10 text-white px-3 py-1 rounded-lg hover:bg-white/20">Editar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </main>
      </div>
    </div>
  )
}
