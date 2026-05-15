'use client'

const STATS = [
  {
    label: 'Hoje no caixa',
    value: 'R$ 1.240',
    sub: '▲ 18% vs ontem',
    color: '#1B8A5A',
    bg: '#ECFDF5',
    icon: '💰',
    trend: '+18%',
    trendUp: true,
    sparkline: [40, 55, 45, 70, 60, 80, 100],
  },
  {
    label: 'Agendamentos hoje',
    value: '12',
    sub: '3 pendentes confirmação',
    color: '#1A3A6B',
    bg: '#EFF6FF',
    icon: '📅',
    trend: '3 pendentes',
    trendUp: null,
    sparkline: [3, 5, 4, 8, 6, 9, 12],
  },
  {
    label: 'Ticket médio',
    value: 'R$ 85',
    sub: '▲ 5% este mês',
    color: '#F5A623',
    bg: '#FFF7ED',
    icon: '🎯',
    trend: '+5%',
    trendUp: true,
    sparkline: [70, 75, 72, 80, 78, 82, 85],
  },
  {
    label: 'Clientes este mês',
    value: '148',
    sub: '12 novos clientes',
    color: '#7C3AED',
    bg: '#F5F3FF',
    icon: '👥',
    trend: '+12 novos',
    trendUp: true,
    sparkline: [80, 95, 100, 110, 120, 135, 148],
  },
]

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = 30
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((s) => (
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
            <MiniSparkline data={s.sparkline} color={s.color} />
          </div>
          <p className="font-sora font-extrabold text-2xl text-[#1C1C2E] mb-0.5">{s.value}</p>
          <p className="text-xs text-[#4A4A5A] mb-2">{s.label}</p>
          <div className="flex items-center gap-1">
            {s.trendUp !== null && (
              <span className="text-xs" style={{ color: s.trendUp ? '#1B8A5A' : '#EF4444' }}>
                {s.trendUp ? '▲' : '▼'}
              </span>
            )}
            <span className="text-xs font-semibold" style={{ color: s.color }}>
              {s.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
