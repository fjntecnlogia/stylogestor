'use client'

import { useState } from 'react'
import Link from 'next/link'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'

const NAV_LINKS = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#precos',          label: 'Preços' },
  { href: '#depoimentos',     label: 'Depoimentos' },
  { href: '/ajuda',           label: 'Ajuda', isLink: true },
]

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-[#1A3A6B] text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F5A623] rounded-lg flex items-center justify-center font-sora font-extrabold text-[#1A3A6B] text-base">S</div>
          <span className="font-sora font-extrabold text-lg">STYLO<span className="text-[#F5A623]">GESTOR</span></span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
          {NAV_LINKS.map((l) =>
            l.isLink
              ? <Link key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
              : <a key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</a>
          )}
        </nav>

        {/* Ações desktop + hamburger mobile */}
        <div className="flex items-center gap-2">
          <Link href={`${APP_URL}/login`} className="text-sm text-white/70 hover:text-white hidden sm:block">Entrar</Link>
          <Link
            href={`${APP_URL}/cadastro`}
            className="bg-[#F5A623] text-[#1A3A6B] font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#e09610] transition-colors"
          >
            Teste grátis
          </Link>
          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1 rounded-lg border border-white/20 hover:bg-white/10 transition-colors ml-1"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-white rounded transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white rounded transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white rounded transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Menu mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#1A3A6B]">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_LINKS.map((l) =>
              l.isLink
                ? <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="py-3 text-white/80 hover:text-white text-sm font-medium border-b border-white/10 last:border-0">{l.label}</Link>
                : <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="py-3 text-white/80 hover:text-white text-sm font-medium border-b border-white/10 last:border-0">{l.label}</a>
            )}
            <Link
              href={`${APP_URL}/login`}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-white/80 hover:text-white text-sm font-medium"
            >
              Entrar no painel
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
