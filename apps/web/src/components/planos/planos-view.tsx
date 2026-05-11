'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PLANS } from '@/lib/stripe'

export function PlanosView() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleCheckout = async (planId: string) => {
    setLoading(planId)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao processar. Tente novamente.')
        setLoading(null)
        return
      }

      window.location.href = data.url
    } catch {
      setError('Erro de conexão. Verifique sua internet.')
      setLoading(null)
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      {canceled && (
        <div className="bg-[#FEF9C3] border border-[#FCD34D] rounded-2xl px-5 py-4 text-sm text-[#92400E] font-medium">
          ⚠️ Pagamento cancelado. Você pode tentar novamente quando quiser.
        </div>
      )}

      {error && (
        <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-2xl px-5 py-4 text-sm text-[#991B1B] font-medium">
          ❌ {error}
        </div>
      )}

      <div>
        <h1 className="font-sora font-bold text-2xl text-[#111827]">Planos e Assinatura</h1>
        <p className="text-[#6B7280] text-sm mt-1">Escolha o plano ideal para sua barbearia. Cancele quando quiser.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col ${
              plan.highlight ? 'border-[#1A3A6B]' : 'border-[#E5E7EB]'
            }`}
          >
            {plan.highlight && (
              <div className="bg-[#1A3A6B] text-center py-1.5">
                <span className="text-[#F5A623] text-xs font-bold uppercase tracking-widest">⭐ Mais popular</span>
              </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
              <p className="font-sora font-bold text-lg text-[#111827]">{plan.name}</p>
              <p className="text-[#6B7280] text-xs mt-0.5 mb-4">{plan.description}</p>

              <div className="mb-5">
                <span className="font-sora font-extrabold text-3xl text-[#1A3A6B]">
                  R$ {(plan.price / 100).toFixed(0)}
                </span>
                <span className="text-[#6B7280] text-sm">/mês</span>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#374151]">
                    <span className="text-[#1B8A5A] font-bold shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading !== null}
                className={`w-full font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed ${
                  plan.highlight
                    ? 'bg-[#1A3A6B] text-white hover:bg-[#142d55]'
                    : 'border-2 border-[#1A3A6B] text-[#1A3A6B] hover:bg-[#1A3A6B] hover:text-white'
                }`}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Aguarde...
                  </span>
                ) : (
                  `Assinar ${plan.name}`
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { icon: '🔒', title: 'Pagamento seguro', desc: 'Processado pelo Stripe com criptografia SSL' },
            { icon: '❌', title: 'Cancele quando quiser', desc: 'Sem fidelidade. Cancele com um clique.' },
            { icon: '💬', title: 'Suporte humanizado', desc: 'Respondemos em até 2h úteis no WhatsApp' },
          ].map((g) => (
            <div key={g.title}>
              <p className="text-2xl mb-1">{g.icon}</p>
              <p className="font-semibold text-sm text-[#111827]">{g.title}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#F0F4FF] border border-[#BFDBFE] rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-semibold text-[#1E40AF] text-sm">Gerenciar assinatura atual</p>
          <p className="text-xs text-[#6B7280]">Altere cartão, veja faturas ou cancele seu plano.</p>
        </div>
        <a
          href="https://billing.stripe.com/p/login/live_eVaaEO0dL3x6grS288"
          target="_blank"
          className="bg-[#1A3A6B] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#142d55] transition-colors"
        >
          Portal do cliente →
        </a>
      </div>
    </div>
  )
}
