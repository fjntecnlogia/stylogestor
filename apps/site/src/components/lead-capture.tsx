'use client'

import { useState } from 'react'
import { trackLeadCapture } from '@/lib/analytics'

export function LeadCapture() {
  const [email, setEmail] = useState('')
  const [whats, setWhats] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    // Simula envio (conectar ao backend depois)
    await new Promise(r => setTimeout(r, 800))
    trackLeadCapture('landing_hero')
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-[#1B8A5A]/20 border border-[#1B8A5A]/40 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <p className="font-sora font-bold text-white text-lg">Perfeito! Te enviamos o acesso.</p>
        <p className="text-white/60 text-sm mt-1">Verifique seu WhatsApp e email em instantes.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
      <input
        type="email"
        placeholder="Seu melhor email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="flex-1 px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#F5A623] text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-[#F5A623] text-[#1A3A6B] font-bold px-8 py-4 rounded-2xl hover:bg-[#e09610] transition-all hover:scale-105 disabled:opacity-70 text-sm whitespace-nowrap"
      >
        {loading ? 'Enviando...' : 'Quero testar grátis →'}
      </button>
    </form>
  )
}
