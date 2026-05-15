'use client'

import { useState } from 'react'

const ALERTS = [
  {
    id: '1',
    type: 'warning',
    icon: '👻',
    title: '3 clientes sem visitar há +30 dias',
    desc: 'Carlos, Rafael e Pedro não aparecem desde abril. Hora de um WhatsApp!',
    action: 'Enviar mensagem',
    color: '#F5A623',
    bg: '#FFF7ED',
    border: '#FED7AA',
  },
  {
    id: '2',
    type: 'info',
    icon: '🎂',
    title: '2 aniversariantes esta semana',
    desc: 'Lucas Ferreira (amanhã) e André Lima (sex). Que tal um desconto especial?',
    action: 'Ver clientes',
    color: '#1A3A6B',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  {
    id: '3',
    type: 'success',
    icon: '📦',
    title: 'Estoque: Pomada Capilar baixo',
    desc: 'Restam apenas 2 unidades. Peça mais antes de acabar.',
    action: 'Ver estoque',
    color: '#1B8A5A',
    bg: '#ECFDF5',
    border: '#A7F3D0',
  },
]

export function AlertsPanel() {
  const [dismissed, setDismissed] = useState<string[]>([])
  const visible = ALERTS.filter(a => !dismissed.includes(a.id))

  if (visible.length === 0) return null

  return (
    <div className="space-y-2">
      {visible.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 px-4 py-3 rounded-2xl border text-sm"
          style={{ background: a.bg, borderColor: a.border }}
        >
          <span className="text-xl shrink-0 mt-0.5">{a.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1C1C2E]">{a.title}</p>
            <p className="text-[#4A4A5A] text-xs mt-0.5">{a.desc}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
              style={{ background: a.color }}
            >
              {a.action}
            </button>
            <button
              onClick={() => setDismissed(p => [...p, a.id])}
              className="text-[#9CA3AF] hover:text-[#4A4A5A] text-lg leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
