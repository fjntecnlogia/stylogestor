'use client'

import { useState } from 'react'

const ACTIONS = [
  { icon: '➕', label: 'Novo agendamento', href: '/agenda' },
  { icon: '👤', label: 'Novo cliente',     href: '/clientes' },
  { icon: '💸', label: 'Lançar despesa',   href: '/financeiro' },
  { icon: '📊', label: 'Ver relatório',    href: '/financeiro' },
]

export function QuickActions() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 bg-[#1A3A6B] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#142d55] transition-colors shadow-sm"
      >
        <span>⚡</span> Ações rápidas
        <span className="text-white/60 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-[#E8E6E2] shadow-xl z-20 w-52 overflow-hidden">
            {ACTIONS.map((a) => (
              <a
                key={a.label}
                href={a.href}
                className="flex items-center gap-3 px-4 py-3 text-sm text-[#1C1C2E] font-medium hover:bg-[#F8F6F2] transition-colors"
                onClick={() => setOpen(false)}
              >
                <span className="text-base">{a.icon}</span>
                {a.label}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
