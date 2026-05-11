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
  { href: '/afiliados',     label: 'Afiliados',      icon: '💸', group: 'extra' },
  { href: '/ajuda',         label: 'Ajuda',          icon: '❓', group: 'extra' },
  { href: '/suporte',       label: 'Suporte',        icon: '🎧', group: 'extra' },
  { href: '/configuracoes', label: 'Configurações',  icon: '⚙️', group: 'config' },
]

interface Props {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: Props) {
  const path = usePathname()

  const mainNav   = NAV.filter((n) => n.group === 'main')
  const extraNav  = NAV.filter((n) => n.group === 'extra')
  const configNav = NAV.filter((n) => n.group === 'config')

  const NavItem = ({ item }: { item: typeof NAV[0] }) => {
    const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-all ${
          active
            ? 'bg-white/10 text-white border-r-2 border-[#F5A623] font-semibold'
            : 'text-white/50 hover:text-white hover:bg-white/5'
        }`}
      >
        <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <aside className={`
      w-60 bg-[#1A3A6B] flex flex-col shrink-0 h-screen
      fixed lg:sticky top-0 z-40 transition-transform duration-300
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo + fechar mobile */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <span className="font-sora font-extrabold text-lg text-white tracking-tight">
          STYLO<span className="text-[#F5A623]">GESTOR</span>
        </span>
        <button
          onClick={onClose}
          className="lg:hidden text-white/50 hover:text-white text-xl leading-none"
          aria-label="Fechar menu"
        >
          ✕
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-3">
        <div className="mb-1">
          {mainNav.map((item) => <NavItem key={item.href} item={item} />)}
        </div>
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="px-5 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">Recursos</p>
          {extraNav.map((item) => <NavItem key={item.href} item={item} />)}
        </div>
        <div className="mt-2 pt-2 border-t border-white/10">
          {configNav.map((item) => <NavItem key={item.href} item={item} />)}
        </div>
      </nav>

      {/* Plano atual */}
      <div className="p-4 m-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Plano</p>
          <Link href="/planos" onClick={onClose} className="text-[10px] text-[#F5A623] hover:underline font-semibold">Mudar</Link>
        </div>
        <p className="text-[#F5A623] font-sora font-bold text-sm">✓ Pro</p>
        <p className="text-white/30 text-[10px] mt-0.5">Renova em 10/06/2026</p>
      </div>
    </aside>
  )
}
