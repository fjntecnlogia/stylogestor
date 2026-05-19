'use client'

import { useDashboardData } from './use-dashboard-data'

/**
 * KPIs do dashboard. Lê do endpoint /api/reports/dashboard
 * (fonte de verdade do banco). Cada card mostra dado real:
 *
 *   - Hoje no caixa: soma de Payments do dia (atendimentos COMPLETED)
 *   - Agendamentos hoje: count do dia (excluindo CANCELED/NO_SHOW)
 *   - Ticket médio: totalHoje / completedHoje
 *   - Clientes este mês: novos clientes criados no mês corrente
 */
export function StatsGrid() {
  const { data, loading } = useDashboardData()
  const k = data.kpis

  const stats = [
    {
      label: 'Hoje no caixa',
      value: k.totalHoje > 0 ? `R$ ${k.totalHoje}` : 'R$ 0',
      sub: k.completedHoje > 0
        ? `${k.completedHoje} ${k.completedHoje === 1 ? 'atendimento' : 'atendimentos'}`
        : 'nenhum atendimento',
      color: '#1B8A5A',
      bg: '#ECFDF5',
      icon: '💰',
      trend: k.completedHoje > 0 ? `${k.completedHoje} hoje` : '—',
      trendUp: k.completedHoje > 0 ? true : null,
    },
    {
      label: 'Agendamentos hoje',
      value: String(k.agendamentosHoje),
      sub: k.pendentesHoje > 0
        ? `${k.pendentesHoje} pendentes`
        : 'sem pendentes',
      color: '#1A3A6B',
      bg: '#EFF6FF',
      icon: '📅',
      trend: k.pendentesHoje > 0 ? `${k.pendentesHoje} pendentes` : '—',
      trendUp: null,
    },
    {
      label: 'Ticket médio',
      value: k.ticketMedio > 0 ? `R$ ${k.ticketMedio}` : 'R$ 0',
      sub: 'por atendimento',
      color: '#F5A623',
      bg: '#FFF7ED',
      icon: '🎯',
      trend: '—',
      trendUp: null,
    },
    {
      label: 'Clientes este mês',
      value: String(k.totalClientes),
      sub: k.novosClientesMes > 0
        ? `+${k.novosClientesMes} ${k.novosClientesMes === 1 ? 'novo' : 'novos'} no mês`
        : 'sem novos este mês',
      color: '#7C3AED',
      bg: '#F5F3FF',
      icon: '👥',
      trend: k.novosClientesMes > 0 ? `+${k.novosClientesMes}` : '—',
      trendUp: k.novosClientesMes > 0 ? true : null,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`bg-white rounded-2xl p-5 border border-[#E8E6E2] shadow-sm hover:shadow-md transition-shadow group cursor-default ${loading ? 'opacity-60' : ''}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: s.bg }}
            >
              {s.icon}
            </div>
          </div>
          <p className="font-sora font-extrabold text-2xl text-[#1C1C2E] mb-0.5">{s.value}</p>
          <p className="text-xs text-[#4A4A5A] mb-2">{s.label}</p>
          <div className="flex items-center gap-1">
            {s.trendUp !== null && (
              <span className="text-xs" style={{ color: s.trendUp ? '#1B8A5A' : '#EF4444' }}>
                {s.trendUp ? '▲' : '▼'}
              </span>
            )}
            <span className="text-xs font-semibold text-[#9CA3AF]">{s.sub}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
