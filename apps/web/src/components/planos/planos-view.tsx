'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PLANS } from '@/lib/plans'

export function PlanosView() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')
  const [ciclo, setCiclo] = useState<'mensal' | 'anual'>('mensal')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const desconto = 17 // % de desconto anual

  const handleCheckout = async (planId: string) => {
    setLoading(planId)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, ciclo }),
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sora font-bold text-2xl text-[#111827]">Planos e Assinatura</h1>
          <p className="text-[#6B7280] text-sm mt-1">14 dias grátis · Sem cartão para trial · Cancele quando quiser</p>
        </div>

        {/* Toggle mensal/anual */}
        <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-xl p-1 self-start sm:self-auto">
          <button
            onClick={() => setCiclo('mensal')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${ciclo === 'mensal' ? 'bg-[#1A3A6B] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setCiclo('anual')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${ciclo === 'anual' ? 'bg-[#1A3A6B] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}
          >
            Anual
            <span className="bg-[#1B8A5A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">-{desconto}%</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const preco = ciclo === 'anual' ? plan.priceAnnual : plan.priceMonthly
          const precoMes = ciclo === 'anual' ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col transition-all ${
                plan.highlight ? 'border-[#1A3A6B] shadow-lg' : 'border-[#E5E7EB] hover:border-[#1A3A6B]/40'
              }`}
            >
              {plan.highlight && (
                <div className="bg-[#1A3A6B] text-center py-2">
                  <span className="text-[#F5A623] text-xs font-bold uppercase tracking-widest">⭐ Mais popular</span>
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <p className="font-sora font-bold text-lg text-[#111827]">{plan.name}</p>
                  <p className="text-[#6B7280] text-xs">{plan.description}</p>
                  <p className="text-[#9CA3AF] text-xs">{plan.subdesc}</p>
                </div>

                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-sora font-extrabold text-3xl text-[#1A3A6B]">
                      R$ {(precoMes / 100).toFixed(0)}
                    </span>
                    <span className="text-[#6B7280] text-sm">/mês</span>
                  </div>
                  {ciclo === 'anual' && (
                    <p className="text-xs text-[#1B8A5A] font-semibold mt-0.5">
                      R$ {(preco / 100).toFixed(0)} cobrado anualmente
                    </p>
                  )}
                </div>

                <p className="text-xs text-[#6B7280] mb-5">14 dias grátis incluídos</p>

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#374151]">
                      <span className="text-[#1B8A5A] font-bold shrink-0 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading !== null}
                  className={`w-full font-bold py-3.5 rounded-xl transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed ${
                    plan.highlight
                      ? 'bg-[#1A3A6B] text-white hover:bg-[#142d55] shadow-sm'
                      : 'border-2 border-[#1A3A6B] text-[#1A3A6B] hover:bg-[#1A3A6B] hover:text-white'
                  }`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Redirecionando...
                    </span>
                  ) : (
                    `Começar grátis — ${plan.name}`
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Formas de pagamento */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <p className="text-sm font-semibold text-[#111827] mb-3">Formas de pagamento aceitas</p>
        <div className="flex flex-wrap gap-3 items-center">
          {[
            { icon: '💳', label: 'Cartão de crédito' },
            { icon: '🏦', label: 'Boleto bancário' },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm text-[#374151] font-medium">
              <span>{m.icon}</span>
              {m.label}
            </div>
          ))}
          <p className="text-xs text-[#9CA3AF] ml-auto">Processado com segurança pelo Stripe</p>
        </div>
      </div>

      {/* Garantias */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: '🔒', title: 'Pagamento 100% seguro', desc: 'Stripe é certificado PCI DSS nível 1' },
          { icon: '🆓', title: '14 dias grátis', desc: 'Sem cobrança durante o trial. Cancele antes e não paga nada.' },
          { icon: '💬', title: 'Suporte humanizado', desc: 'Respondemos em até 2h úteis no WhatsApp' },
        ].map((g) => (
          <div key={g.title} className="bg-white rounded-2xl border border-[#E5E7EB] p-4 text-center shadow-sm">
            <p className="text-2xl mb-1">{g.icon}</p>
            <p className="font-semibold text-sm text-[#111827]">{g.title}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{g.desc}</p>
          </div>
        ))}
      </div>

      {/* Portal do cliente */}
      <div className="bg-[#1A3A6B] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-sora font-bold text-white">Já tem uma assinatura?</p>
          <p className="text-white/60 text-sm mt-0.5">Gerencie seu plano, altere o cartão ou baixe faturas.</p>
        </div>
        <a
          href="https://billing.stripe.com/p/login/live_eVaaEO0dL3x6grS288"
          target="_blank"
          className="bg-[#F5A623] text-[#1A3A6B] text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#e09610] transition-colors whitespace-nowrap shrink-0"
        >
          Portal do cliente →
        </a>
      </div>

    </div>
  )
}
