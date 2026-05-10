const ENTRIES = [
  { label: 'Cortes (8x)',  value: '+R$ 440',  type: 'in'  },
  { label: 'Barba (5x)',   value: '+R$ 200',  type: 'in'  },
  { label: 'Combo (4x)',   value: '+R$ 480',  type: 'in'  },
  { label: 'Produtos',     value: '+R$ 120',  type: 'in'  },
  { label: 'Material',     value: '-R$ 85',   type: 'out' },
]

export function CashflowCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E6E2] shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-sora font-bold text-[#1C1C2E]">💰 Caixa de hoje</h2>
        <a href="/financeiro" className="text-xs text-[#1A3A6B] font-medium hover:underline">Ver financeiro</a>
      </div>
      <div className="space-y-0">
        {ENTRIES.map((e, i) => (
          <div key={i} className="flex justify-between items-center py-2.5 border-b border-[#E8E6E2] last:border-0">
            <span className="text-sm text-[#4A4A5A]">{e.label}</span>
            <span className={`text-sm font-semibold ${e.type === 'in' ? 'text-[#1B8A5A]' : 'text-red-500'}`}>
              {e.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t-2 border-[#E8E6E2] flex justify-between items-center">
        <span className="font-semibold text-[#1C1C2E]">Total</span>
        <span className="font-sora font-bold text-xl text-[#1B8A5A]">R$ 1.155</span>
      </div>
      <button className="w-full mt-4 bg-[#1A3A6B] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#142d55] transition-colors">
        Fechar caixa do dia
      </button>
    </div>
  )
}
