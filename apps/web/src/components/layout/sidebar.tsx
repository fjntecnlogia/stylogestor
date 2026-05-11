'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard',     label: 'Dashboard',     icon: '📊', group: 'main' },
  { href: '/agenda',        label: 'Agenda',         icon: '📅', group: 'main' },
  { href: '/clientes',      label: 'Clientes',       icon: '👥', group: 'main' },
  { href: '/financeiro',    label: 'Financeiro',     icon: '💰', group: 'main' },
  { href: '/profissionais', label: 'Profissionais',  icon: '✂️', group: 'main' },
  { href: '/servicos',      label: 'Serviços',       icon: '📋', group: 'main' },
  { href: '/estoque',       label: 'Estoque',        icon: '📦', group: 'main' },
  { href: '/fidelidade',    label: 'Fidelidade',     icon: '⭐', group: 'extra' },
  { href: '/planos',        label: 'Planos',         icon: '💳', group: 'extra' },
  { href: '/configuracoes', label: 'Configurações',  icon: '⚙️', group: 'config' },
]

export function Sidebar() {
  const path = usePathname()

  const mainNav   = NAV.filter((n) => n.group === 'main')
  const extraNav  = NAV.filter((n) => n.group === 'extra')
  const configNav = NAV.filter((n) => n.group === 'config')

  const NavItem = ({ item }: { item: typeof NAV[0] }) => {
    const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-all ${
          active
            ? 'bg-white/10 text-white border-r-2 border-[#F5A623] font-semibold'
            : 'text-white/50 hover:text-white hover:bg-white/5'
        }`}
      >
        <span className="text-base w-5 text-center">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <aside className="w-60 bg-[#1A3A6B] flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <span className="font-sora font-extrabold text-lg text-white tracking-tight">
          STYLO<span className="text-[#F5A623]">GESTOR</span>
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-3">
        {/* Principal */}
        <div className="mb-1">
          {mainNav.map((item) => <NavItem key={item.href} item={item} />)}
        </div>

        {/* Extras */}
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="px-5 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">
            Recursos
          </p>
          {extraNav.map((item) => <NavItem key={item.href} item={item} />)}
        </div>

        {/* Config */}
        <div className="mt-2 pt-2 border-t border-white/10">
          {configNav.map((item) => <NavItem key={item.href} item={item} />)}
        </div>
      </nav>

      {/* Plano atual */}
      <div className="p-4 m-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Plano</p>
          <Link href="/planos" className="text-[10px] text-[#F5A623] hover:underline font-semibold">
            Mudar
          </Link>
        </div>
        <p className="text-[#F5A623] font-sora font-bold text-sm">✓ Pro</p>
        <p className="text-white/30 text-[10px] mt-0.5">Renova em 10/06/2026</p>
      </div>
    </aside>
  )
}
