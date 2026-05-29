'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/lib/use-user'
import { UserMenu } from '@/components/auth/user-menu'

const NAV = [
  { href: '/profissional/agenda',     label: 'Agenda',      icon: '📅' },
  { href: '/profissional/horarios',   label: 'Horários',    icon: '🕐' },
  { href: '/profissional/fechamento', label: 'Fechamento',  icon: '💰' },
  { href: '/profissional/perfil',     label: 'Meu perfil',  icon: '👤' },
]

interface Props {
  children: React.ReactNode
}

/**
 * Shell do painel do profissional (barbeiro).
 * Mobile-first — barbeiro usa muito no celular durante o expediente.
 * Sidebar vira bottom-bar em mobile.
 */
export function ProfissionalShell({ children }: Props) {
  const path = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useUser()
  const nomeProfissional = (user?.app_metadata as { professionalName?: string } | undefined)?.professionalName
    ?? (user?.user_metadata as { name?: string } | undefined)?.name
    ?? 'Profissional'

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col lg:flex-row">
      {/* Sidebar (desktop) / Topbar (mobile) */}
      <aside className="lg:w-60 bg-[#1A3A6B] flex flex-col shrink-0 lg:h-screen lg:sticky top-0 z-40">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="font-sora font-extrabold text-lg text-white tracking-tight">
              STYLO<span className="text-[#F5A623]">GESTOR</span>
            </span>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-0.5">Profissional</p>
          </div>
          {/* Toggle mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Nav desktop sempre visível; mobile abre via toggle */}
        <nav className={`flex-1 ${menuOpen ? 'block' : 'hidden lg:block'} py-2`}>
          {NAV.map((item) => {
            const active = path?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition-all ${
                  active
                    ? 'bg-white/10 text-white border-r-2 border-[#F5A623] font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User info + logout (desktop) */}
        <div className={`p-4 border-t border-white/10 ${menuOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center gap-3">
            {/* Logout → /login (lib/use-user signOut) */}
            <UserMenu size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{nomeProfissional}</p>
              <p className="text-white/40 text-[10px]">Profissional</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 lg:p-6 max-w-full overflow-x-hidden pb-20 lg:pb-6">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] shadow-lg z-30 flex justify-around">
        {NAV.map((item) => {
          const active = path?.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-2 flex-1 text-[10px] font-semibold transition-colors ${
                active ? 'text-[#1A3A6B]' : 'text-[#9CA3AF]'
              }`}
            >
              <span className="text-lg mb-0.5">{item.icon}</span>
              <span className="leading-none">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
