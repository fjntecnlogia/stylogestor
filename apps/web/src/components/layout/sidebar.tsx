'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard',       label: 'Dashboard',      icon: '📊' },
  { href: '/agenda',          label: 'Agenda',          icon: '📅' },
  { href: '/clientes',        label: 'Clientes',        icon: '👥' },
  { href: '/financeiro',      label: 'Financeiro',      icon: '💰' },
  { href: '/profissionais',   label: 'Profissionais',   icon: '✂️' },
  { href: '/servicos',        label: 'Serviços',        icon: '📋' },
  { href: '/estoque',         label: 'Estoque',         icon: '📦' },
  { href: '/configuracoes',   label: 'Configurações',   icon: '⚙️' },
]

export function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-60 bg-[#1A3A6B] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <span className="font-sora font-extrabold text-lg text-white tracking-tight">
          STYLO<span className="text-[#F5A623]">GESTOR</span>
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = path.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                active
                  ? 'bg-white/10 text-white border-r-2 border-[#F5A623]'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className={active ? 'font-medium' : ''}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Plano atual */}
      <div className="p-4 m-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Plano atual</p>
        <p className="text-[#F5A623] font-bold text-sm">Pro</p>
        <p className="text-white/40 text-xs mt-1">14 dias de trial</p>
      </div>
    </aside>
  )
}
