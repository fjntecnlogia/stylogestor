'use client'

import { useState } from 'react'
import { useUser, refreshUser } from '@/lib/use-user'
import { useToast } from '@/components/ui/toast'

interface Props {
  /** Variante visual: 'card' (full card com bg) ou 'inline' (sem bg, pra encaixar em outras seções). */
  variant?: 'card' | 'inline'
  /** Mensagem personalizada acima do input. */
  title?: string
  subtitle?: string
  /** Callback após resgate com sucesso (ex.: refresh da página). */
  onRedeem?: (info: { code: string; trialDaysAdded: number; trialEndsAt: string }) => void
}

/**
 * Input de código promocional pro gestor da barbearia auto-resgatar.
 * Chama POST /api/me/redeem-code e mostra feedback via toast.
 *
 * Aparece em /planos, /bloqueado e /configurações pra máxima visibilidade.
 */
export function PromoCodeInput({
  variant = 'card',
  title = '🎟️ Tem um código promocional?',
  subtitle = 'Digite o código pra ganhar dias extras de trial.',
  onRedeem,
}: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { success, error } = useToast()
  const { user } = useUser()

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      error('Digite um código')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/me/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        error(data.error || 'Erro ao resgatar código')
        return
      }
      success(`Código ${data.code} aplicado! +${data.trialDaysAdded} dias de trial 🎉`)
      setCode('')
      // Renova sessão pra atualizar app_metadata.subscriptionStatus (se mudou)
      try { await refreshUser() } catch { /* não-bloqueante */ }
      onRedeem?.(data)
    } catch (err) {
      error('Erro de conexão. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const wrapperClass = variant === 'card'
    ? 'bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-5'
    : 'border-t border-[#E8E6E2] pt-4'

  return (
    <div className={wrapperClass}>
      {title && <p className="font-sora font-bold text-[#1C1C2E] mb-1">{title}</p>}
      {subtitle && <p className="text-xs text-[#6B7280] mb-3">{subtitle}</p>}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="EX: INFLUENCER, VIP60"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRedeem() }}
          disabled={loading}
          className="flex-1 border border-[#E8E6E2] rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F5A623] disabled:opacity-50"
        />
        <button
          onClick={handleRedeem}
          disabled={loading || !code.trim()}
          className="bg-[#F5A623] hover:bg-[#e0951c] disabled:opacity-40 text-[#1A3A6B] font-bold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
        >
          {loading ? 'Aplicando...' : '✓ Resgatar'}
        </button>
      </div>
    </div>
  )
}
