'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { useUser, refreshUser } from '@/lib/use-user'

interface TrialStatus {
  status: 'trial' | 'active' | 'expired' | 'canceled' | 'unknown'
  daysRemaining: number
  trialEndsAt: string | null
  isPaying: boolean
  plan: string
}

/**
 * Card de trial no dashboard. Diferente do TrialBadge minimal do header:
 * tem dias em destaque, data de fim, e atalho pra resgatar código direto
 * sem precisar navegar pra /planos.
 *
 * Esconde quando o gestor é assinante ativo (não polui dashboard de pagante).
 */
export function TrialCard() {
  const [data, setData] = useState<TrialStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [code, setCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const { success, error } = useToast()
  const { user } = useUser()

  // Função pra buscar/atualizar status — usa em mount e após resgate
  const fetchStatus = () => {
    fetch('/api/me/trial-status')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: TrialStatus) => setData(d))
      .catch(() => { /* silencioso */ })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { error('Digite um código'); return }
    setRedeeming(true)
    try {
      const res = await fetch('/api/me/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      const result = await res.json()
      if (!res.ok) {
        error(result.error || 'Erro ao resgatar')
        return
      }
      success(`Código ${result.code} aplicado! +${result.trialDaysAdded} dias 🎉`)
      setCode('')
      setShowCodeInput(false)
      fetchStatus() // re-busca status atualizado
      try { await refreshUser() } catch { /* não-bloqueante */ }
    } catch (err) {
      error('Erro de conexão')
      console.error(err)
    } finally {
      setRedeeming(false)
    }
  }

  // Não renderiza enquanto carrega — evita flash de UI
  if (loading || !data) return null

  // Assinante pago — não mostra card (informação já tá no badge do header)
  if (data.status === 'active') return null

  // Define paleta + mensagens por status
  const isUrgent = data.status === 'trial' && data.daysRemaining <= 7
  const isCritical = data.status === 'trial' && data.daysRemaining <= 2
  const isDead = data.status === 'expired' || data.status === 'canceled'

  const palette = isDead
    ? { bg: 'bg-[#FEF2F2]', border: 'border-[#FCA5A5]', accent: '#991B1B', icon: '🔒' }
    : isCritical
    ? { bg: 'bg-[#FEE2E2]', border: 'border-[#EF4444]', accent: '#991B1B', icon: '⚠️' }
    : isUrgent
    ? { bg: 'bg-[#FFF7ED]', border: 'border-[#FB923C]', accent: '#9A3412', icon: '⏳' }
    : { bg: 'bg-[#FEF9C3]', border: 'border-[#FCD34D]', accent: '#854D0E', icon: '✨' }

  const endDate = data.trialEndsAt
    ? new Date(data.trialEndsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const title = isDead
    ? data.status === 'canceled'
      ? 'Sua assinatura foi cancelada'
      : 'Seu trial expirou'
    : isCritical
    ? data.daysRemaining === 0
      ? 'Seu trial acaba HOJE!'
      : `Trial acaba em ${data.daysRemaining} ${data.daysRemaining === 1 ? 'dia' : 'dias'}`
    : `Trial: ${data.daysRemaining} dias restantes`

  const subtitle = endDate
    ? (isDead ? `Expirou em ${endDate}` : `Termina em ${endDate}`)
    : ''

  return (
    <div className={`${palette.bg} border ${palette.border} rounded-2xl p-5`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-3xl shrink-0">{palette.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-sora font-bold text-base sm:text-lg" style={{ color: palette.accent }}>
              {title}
            </p>
            {subtitle && (
              <p className="text-sm mt-0.5" style={{ color: palette.accent, opacity: 0.75 }}>
                {subtitle}
              </p>
            )}
            <p className="text-xs text-[#6B7280] mt-1.5">
              {isDead
                ? 'Assine um plano ou use um código pra reativar agora.'
                : 'Aproveite pra testar todas as funções. Assine antes do fim pra não interromper o uso.'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowCodeInput((v) => !v)}
            className="text-xs font-bold border-2 px-3 py-2 rounded-xl transition-colors whitespace-nowrap hover:bg-white/50"
            style={{ borderColor: palette.accent, color: palette.accent }}
          >
            🎟️ Tenho código
          </button>
          <Link
            href="/planos"
            className="bg-[#1A3A6B] hover:bg-[#142d55] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            Ver planos →
          </Link>
        </div>
      </div>

      {/* Input de código inline (mostra ao clicar em "Tenho código") */}
      {showCodeInput && (
        <div className="mt-4 pt-4 border-t border-current/20">
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <input
              type="text"
              placeholder="EX: INFLUENCER, VIP60"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRedeem() }}
              disabled={redeeming}
              autoFocus
              className="flex-1 min-w-0 border border-[#E8E6E2] bg-white rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F5A623] disabled:opacity-50"
            />
            <button
              onClick={handleRedeem}
              disabled={redeeming || !code.trim()}
              className="bg-[#F5A623] hover:bg-[#e0951c] disabled:opacity-40 text-[#1A3A6B] font-bold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              {redeeming ? 'Aplicando...' : '✓ Resgatar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
