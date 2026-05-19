'use client'

import { useMemo } from 'react'
import { useTenantPersistedState } from '@/lib/tenant-storage'
import { getInitialClients, type ClientFixture } from '../clientes/__fixtures__/clients'
import { getInitialAppointments, type AppointmentFixture } from '../agenda/__fixtures__/appointments'

/**
 * KPIs do dashboard derivados do storage local por tenant.
 * Em prod (NEXT_PUBLIC_USE_MOCKS=false), começa com 0 — gestor preenche
 * conforme cadastra clientes e agendamentos. Em dev (=true), usa fixtures.
 */
export function StatsGrid() {
  const [clients] = useTenantPersistedState<ClientFixture[]>('clients', getInitialClients())
  const [appointments] = useTenantPersistedState<AppointmentFixture[]>(
    'agenda:appointments',
    getInitialAppointments(),
  )

  const stats = useMemo(() => {
    const concluidos = appointments.filter((a) => a.status === 'COMPLETED')
    const pendentes = appointments.filter((a) => ['SCHEDULED', 'CONFIRMED'].includes(a.status))
    const totalDia = concluidos.reduce((s, a) => s + a.price - a.discount, 0)
    const ticketMedio = concluidos.length ? Math.round(totalDia / concluidos.length) : 0

    return [
      {
        label: 'Hoje no caixa',
        value: totalDia > 0 ? `R$ ${totalDia}` : 'R$ 0',
        sub: concluidos.length > 0 ? `${concluidos.length} atendimentos` : 'nenhum atendimento',
        color: '#1B8A5A',
        bg: '#ECFDF5',
        icon: '💰',
        trend: concluidos.length > 0 ? `${concluidos.length} hoje` : '—',
        trendUp: concluidos.length > 0 ? true : null,
      },
      {
        label: 'Agendamentos hoje',
        value: String(appointments.length),
        sub: pendentes.length > 0 ? `${pendentes.length} pendentes` : 'sem agendamentos',
        color: '#1A3A6B',
        bg: '#EFF6FF',
        icon: '📅',
        trend: pendentes.length > 0 ? `${pendentes.length} pendentes` : '—',
        trendUp: null,
      },
      {
        label: 'Ticket médio',
        value: ticketMedio > 0 ? `R$ ${ticketMedio}` : 'R$ 0',
        sub: 'por atendimento',
        color: '#F5A623',
        bg: '#FFF7ED',
        icon: '🎯',
        trend: '—',
        trendUp: null,
      },
      {
        label: 'Clientes este mês',
        value: String(clients.length),
        sub: clients.length > 0 ? `${clients.length} cadastrados` : 'sem clientes ainda',
        color: '#7C3AED',
        bg: '#F5F3FF',
        icon: '👥',
        trend: clients.length > 0 ? `${clients.length}` : '—',
        trendUp: clients.length > 0 ? true : null,
      },
    ]
  }, [appointments, clients])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-2xl p-5 border border-[#E8E6E2] shadow-sm hover:shadow-md transition-shadow group cursor-default"
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
