const APPOINTMENTS = [
  { time: '14:00', client: 'Carlos Oliveira', service: 'Corte + Barba · R$ 60', status: 'confirmed' },
  { time: '14:30', client: 'Rafael Santos',   service: 'Corte · R$ 40',         status: 'pending'   },
  { time: '15:00', client: 'Pedro Alves',     service: 'Barba · R$ 30',         status: 'confirmed' },
  { time: '15:30', client: 'Lucas Ferreira',  service: 'Corte + Barba · R$ 60', status: 'confirmed' },
]

const STATUS_MAP = {
  confirmed: { label: 'Confirmado', cls: 'bg-[#1B8A5A]/10 text-[#1B8A5A]' },
  pending:   { label: 'Aguardando', cls: 'bg-[#F5A623]/10 text-[#b07a10]' },
}

export function AppointmentsToday() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E6E2] shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-sora font-bold text-[#1C1C2E]">📅 Agendamentos de hoje</h2>
        <a href="/agenda" className="text-xs text-[#1A3A6B] font-medium hover:underline">Ver todos</a>
      </div>
      <div className="space-y-0">
        {APPOINTMENTS.map((a, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-[#E8E6E2] last:border-0">
            <span className="text-xs text-[#4A4A5A] w-10 shrink-0">{a.time}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1C1C2E] truncate">{a.client}</p>
              <p className="text-xs text-[#4A4A5A] truncate">{a.service}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${STATUS_MAP[a.status as keyof typeof STATUS_MAP].cls}`}>
              {STATUS_MAP[a.status as keyof typeof STATUS_MAP].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
