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
  const [resposta, setResposta] = useState('')

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
      <main className="flex-1 overflow-y-auto bg-[#0F172A]">
        <div className="p-6 space-y-6">

          {/* ── DASHBOARD ── */}
          {page === 'dashboard' && (
            <>
              <div>
                <h1 className="font-sora font-bold text-2xl text-white">Visão geral do SaaS</h1>
                <p className="text-white/40 text-sm mt-0.5">Todos os dados em tempo real — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Barbearia','Plano','Status','MRR','Clientes','Agend.','Último login','Ações'].map((h) => (
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
                              <button className="text-[10px] bg-white/10 text-white px-2 py-1 rounded-lg hover:bg-white/20">Ver</button>
                              {t.status === 'past_due' && <button className="text-[10px] bg-[#FEE2E2] text-[#991B1B] px-2 py-1 rounded-lg font-bold">Cobrar</button>}
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

          {/* ── RECEITA ── */}
          {page === 'revenue' && (
            <>
              <h1 className="font-sora font-bold text-2xl text-white">Receita do SaaS</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'MRR atual',    value: `R$ ${totalMRR}`,        sub: 'receita recorrente mensal' },
                  { label: 'ARR',          value: `R$ ${totalMRR * 12}`,   sub: 'receita anual recorrente' },
                  { label: 'Churn rate',   value: '4,8%',                  sub: '1 cancelamento este mês' },
                  { label: 'LTV médio',    value: 'R$ 2.682',              sub: 'por tenant (18 meses)' },
                  { label: 'CAC estimado', value: 'R$ 45',                 sub: 'custo de aquisição' },
                  { label: 'Payback',      value: '0,3 meses',             sub: 'recuperação do CAC' },
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
  )
}
