// Stats fictícios — serão substituídos por dados reais da API
const STATS = [
  { label: 'Hoje no caixa',       value: 'R$ 1.240', sub: '▲ 18% vs ontem',   color: '#1B8A5A' },
  { label: 'Agendamentos hoje',   value: '12',        sub: '3 pendentes',       color: '#1A3A6B' },
  { label: 'Ticket médio',        value: 'R$ 85',     sub: '▲ 5% este mês',    color: '#F5A623' },
  { label: 'Clientes este mês',   value: '148',       sub: '12 novos',          color: '#1A3A6B' },
]

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((s) => (
        <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#E8E6E2] shadow-sm">
          <p className="text-xs text-[#4A4A5A] mb-2">{s.label}</p>
          <p className="font-sora font-bold text-2xl text-[#1C1C2E]">{s.value}</p>
          <p className="text-xs mt-1" style={{ color: s.color }}>{s.sub}</p>
        </div>
      ))}
    </div>
  )
}
