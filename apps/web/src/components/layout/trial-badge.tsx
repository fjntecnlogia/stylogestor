'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TrialStatus {
  status: 'trial' | 'active' | 'expired' | 'canceled' | 'unknown'
  daysRemaining: number
  trialEndsAt: string | null
  isPaying: boolean
  plan: string
}

/**
 * Badge no header mostrando dias restantes do trial.
 *
 * Estados visuais:
 *   - trial + >7d:   amarelo discreto, "✨ Trial: X dias"
 *   - trial + ≤7d:   laranja, "⏳ Trial: X dias"
 *   - trial + ≤2d:   vermelho pulsante, "⚠️ Acaba em Xd"
 *   - expired:       cinza, "Trial expirou — assinar"
 *   - active:        verde discreto, "✓ Plano [nome]"
 *   - canceled:      vermelho, "Cancelado — reativar"
 *
 * Click leva sempre pra /planos.
 */
export function TrialBadge() {
  const [data, setData] = useState<TrialStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me/trial-status')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: TrialStatus) => { if (!cancelled) setData(d) })
      .catch(() => { /* silencioso — badge some se API falhar */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading || !data) return null

  // Plano pago — badge verde discreto
  if (data.status === 'active') {
    return (
      <Link
        href="/planos"
        className="inline-flex items-center gap-1.5 bg-[#ECFDF5] border border-[#6EE7B7] text-[#065F46] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#D1FAE5] transition-colors"
        title="Ver detalhes do plano"
      >
        <span>✓</span>
        <span className="hidden sm:inline">Plano {data.plan}</span>
        <span className="sm:hidden">{data.plan}</span>
      </Link>
    )
  }

  // Cancelado — vermelho
  if (data.status === 'canceled') {
    return (
      <Link
        href="/planos"
        className="inline-flex items-center gap-1.5 bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#FECACA] transition-colors"
      >
        <span>⛔</span>
        <span>Cancelada · reativar</span>
      </Link>
    )
  }

  // Expirou — cinza
  if (data.status === 'expired') {
    return (
      <Link
        href="/planos"
        className="inline-flex items-center gap-1.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#FEE2E2] transition-colors"
      >
        <span>🔒</span>
        <span>Trial expirou · assinar</span>
      </Link>
    )
  }

  // Trial ativo — cor varia por urgência
  const days = data.daysRemaining
  if (days <= 2) {
    // CRÍTICO — pulsante vermelho
    return (
      <Link
        href="/planos"
        className="inline-flex items-center gap-1.5 bg-[#FEE2E2] border border-[#EF4444] text-[#991B1B] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#FECACA] transition-all animate-pulse"
      >
        <span>⚠️</span>
        <span>{days === 0 ? 'Acaba hoje!' : `Acaba em ${days}d`}</span>
      </Link>
    )
  }
  if (days <= 7) {
    // ATENÇÃO — laranja
    return (
      <Link
        href="/planos"
        className="inline-flex items-center gap-1.5 bg-[#FFF7ED] border border-[#FB923C] text-[#9A3412] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#FFEDD5] transition-colors"
        title={data.trialEndsAt ? `Trial termina em ${new Date(data.trialEndsAt).toLocaleDateString('pt-BR')}` : ''}
      >
        <span>⏳</span>
        <span>Trial: {days} {days === 1 ? 'dia' : 'dias'}</span>
      </Link>
    )
  }
  // Tranquilo — amarelo claro
  return (
    <Link
      href="/planos"
      className="inline-flex items-center gap-1.5 bg-[#FEF9C3] border border-[#FCD34D] text-[#854D0E] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#FEF3C7] transition-colors"
      title={data.trialEndsAt ? `Trial termina em ${new Date(data.trialEndsAt).toLocaleDateString('pt-BR')}` : ''}
    >
      <span>✨</span>
      <span>Trial: {days} dias</span>
    </Link>
  )
}
