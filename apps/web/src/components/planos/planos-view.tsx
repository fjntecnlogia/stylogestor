'use client'

import { useState } from 'react'

const PLANOS = [
  {
    id: 'STARTER', name: 'Starter', price: 79, priceAnual: 790,
    desc: 'Para quem está começando',
    profissionais: '1 profissional',
    recursos: [
      { ok: true,  texto: 'Agenda completa' },
      { ok: true,  texto: 'Agendamento online' },
      { ok: true,  texto: 'Clientes ilimitados' },
      { ok: true,  texto: 'Serviços e preços' },
      { ok: false, texto: 'WhatsApp automático' },
      { ok: false, texto: 'Módulo financeiro' },
      { ok: false, texto: 'Programa de fidelidade' },
      { ok: false, texto: 'Relatórios avançados' },
    ],
  },
  {
    id: 'PRO', name: 'Pro', price: 149, priceAnual: 1490,
    desc: 'O favorito das barbearias',
    profissionais: 'até 5 profissionais',
    destaque: true,
    recursos: [
      { ok: true, texto: 'Agenda completa' },
      { ok: true, texto: 'Agendamento online' },
      { ok: true, texto: 'Clientes ilimitados' },
      { ok: true, texto: 'WhatsApp automático' },
      { ok: true, texto: 'Módulo financeiro completo' },
      { ok: true, texto: 'Programa de fidelidade' },
      { ok: true, texto: 'Comissões automáticas' },
      { ok: true, texto: 'Relatórios básicos' },
    ],
  },
  {
    id: 'PREMIUM', name: 'Premium', price: 249, priceAnual: 2490,
    desc: 'Para quem quer o máximo',
    profissionais: 'Profissionais ilimitados',
    recursos: [
      { ok: true, texto: 'Tudo do Pro' },
      { ok: true, texto: 'Controle de estoque' },
      { ok: true, texto: 'CRM avançado' },
      { ok: true, texto: 'Relatórios avançados' },
      { ok: true, texto: 'Exportação PDF/Excel' },
      { ok: true, texto: 'Suporte prioritário' },
      { ok: true, texto: 'Múltiplas unidades (em breve)' },
      { ok: true, texto: 'API de integração (em breve)' },
    ],
  },
]

const INVOICES = [
  { id: '1', date: '10/05/2026', desc: 'Mensalidade Pro — Maio/2026',   amount: 149, status: 'paid'   },
  { id: '2', date: '10/04/2026', desc: 'Mensalidade Pro — Abril/2026',  amount: 149, status: 'paid'   },
  { id: '3', date: '10/03/2026', desc: 'Mensalidade Pro — Março/2026',  amount: 149, status: 'paid'   },
]

const STATUS_INVOICE = {
  paid:    { label: 'Pago',     cls: 'bg-[#D1FAE5] text-[#065F46]' },
  pending: { label: 'Pendente', cls: 'bg-[#FEF9C3] text-[#92400E]' },
  failed:  { label: 'Falhou',   cls: 'bg-[#FEE2E2] text-[#991B1B]' },
}

export function PlanosView() {
  const [ciclo, setCiclo] = useState<'mensal' | 'anual'>('mensal')
  const [planoAtual] = useState('PRO')
  const [loadingPlano, setLoadingPlano] = useState<string | null>(null)

  const handleAssinar = async (planoId: string) => {
    setLoadingPlano(planoId)
    // TODO: chamar API → criar checkout Pagar.me → redirecionar para URL de pagamento
    alert(`Em breve: checkout do plano ${planoId} via Pagar.me!\n\nO link de pagamento será gerado e enviado por email.`)
    setLoadingPlano(null)
  }

  return (
    <div className="space-y-8">
      {/* Plano atual */}
      <div className="bg-gradient-to-r from-[#1A3A6B] to-[#1e4580] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm font-medium">Seu plano atual</p>
            <p className="font-sora font-extrabold text-3xl mt-1">
              Plano Pro <span className="text-[#F5A623]">✓</span>
            </p>
            <p className="text-white/70 text-sm mt-1">Próxima cobrança: <strong className="text-white">10/06/2026 — R$ 149,00</strong></p>
          </div>
          <div className="flex gap-3">
            <div className="text-center bg-white/10 rounded-xl px-5 py-3">
              <p className="font-sora font-bold text-2xl">5</p>
              <p className="text-white/60 text-xs">Profissionais</p>
            </div>
            <div className="text-center bg-white/10 rounded-xl px-5 py-3">
              <p className="font-sora font-bold text-2xl">∞</p>
              <p className="text-white/60 text-xs">Clientes</p>
            </div>
            <div className="text-center bg-white/10 rounded-xl px-5 py-3">
              <p className="font-sora font-bold text-2xl">∞</p>
              <p className="text-white/60 text-xs">Agendamentos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle mensal/anual */}
      <div className="flex flex-col items-center gap-3">
        <h2 className="font-sora font-bold text-xl text-[#111827]">
          {planoAtual === 'PRO' ? 'Mudar de plano' : 'Escolher plano'}
        </h2>
        <div className="flex items-center gap-2 bg-[#F3F4F6] rounded-xl p-1">
          <button onClick={() => setCiclo('mensal')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${ciclo === 'mensal' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280]'}`}>
            Mensal
          </button>
          <button onClick={() => setCiclo('anual')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${ciclo === 'anual' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280]'}`}>
            Anual
            <span className="text-xs font-bold bg-[#1B8A5A] text-white px-1.5 py-0.5 rounded-full">-17%</span>
          </button>
        </div>
      </div>

      {/* Cards de plano */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANOS.map((p) => {
          const isCurrent = p.id === planoAtual
          const valor = ciclo === 'anual' ? Math.round(p.priceAnual / 12) : p.price
          return (
            <div key={p.id} className={`bg-white rounded-2xl border-2 p-6 flex flex-col transition-all shadow-sm ${
              p.destaque ? 'border-[#1A3A6B] shadow-lg' : isCurrent ? 'border-[#1B8A5A]' : 'border-[#E5E7EB]'
            }`}>
              {p.destaque && !isCurrent && (
                <div className="bg-[#1A3A6B] text-white text-xs font-bold text-center py-1.5 rounded-lg mb-4 tracking-wide">
                  MAIS POPULAR
                </div>
              )}
              {isCurrent && (
                <div className="bg-[#D1FAE5] text-[#065F46] text-xs font-bold text-center py-1.5 rounded-lg mb-4 tracking-wide">
                  ✓ PLANO ATUAL
                </div>
              )}

              <h3 className="font-sora font-bold text-xl text-[#111827]">{p.name}</h3>
              <p className="text-[#6B7280] text-sm font-medium mt-0.5">{p.desc}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{p.profissionais}</p>

              <div className="mt-4 mb-5">
                <span className="font-sora font-extrabold text-4xl text-[#111827]">R$ {valor}</span>
                <span className="text-[#6B7280] text-sm">/mês</span>
                {ciclo === 'anual' && (
                  <p className="text-xs text-[#1B8A5A] font-semibold mt-1">
                    R$ {p.priceAnual}/ano — economize R$ {(p.price * 12) - p.priceAnual}/ano
                  </p>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {p.recursos.map((r) => (
                  <li key={r.texto} className={`flex items-center gap-2 text-sm ${r.ok ? 'text-[#374151]' : 'text-[#D1D5DB]'}`}>
                    <span className={`font-bold text-base ${r.ok ? 'text-[#1B8A5A]' : 'text-[#D1D5DB]'}`}>
                      {r.ok ? '✓' : '–'}
                    </span>
                    <span className={r.ok ? 'font-medium' : ''}>{r.texto}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button className="w-full border-2 border-[#E5E7EB] text-[#6B7280] font-semibold py-2.5 rounded-xl cursor-default">
                  Plano atual
                </button>
              ) : (
                <button
                  onClick={() => handleAssinar(p.id)}
                  disabled={loadingPlano === p.id}
                  className={`w-full font-bold py-2.5 rounded-xl transition-all disabled:opacity-60 ${
                    p.destaque
                      ? 'bg-[#1A3A6B] text-white hover:bg-[#142d55] shadow-md'
                      : 'border-2 border-[#1A3A6B] text-[#1A3A6B] hover:bg-[#1A3A6B]/5'
                  }`}>
                  {loadingPlano === p.id ? 'Aguarde...' : p.price > 149 ? 'Fazer upgrade' : 'Fazer downgrade'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Métodos de pagamento aceitos */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
        <h3 className="font-sora font-bold text-[#111827] mb-3">💳 Formas de pagamento aceitas</h3>
        <div className="flex gap-3 flex-wrap">
          {[
            { icon: '💳', label: 'Cartão de crédito', sub: 'Visa, Master, Elo, Amex' },
            { icon: '🔷', label: 'PIX',               sub: 'Aprovação imediata' },
            { icon: '📄', label: 'Boleto bancário',   sub: 'Vencimento em 3 dias' },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3">
              <span className="text-2xl">{m.icon}</span>
              <div>
                <p className="text-sm font-semibold text-[#111827]">{m.label}</p>
                <p className="text-xs text-[#6B7280]">{m.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#9CA3AF] mt-3">
          Pagamentos processados com segurança pelo <strong>Pagar.me</strong> ·
          Cancele a qualquer momento sem multa
        </p>
      </div>

      {/* Histórico de faturas */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <h3 className="font-sora font-bold text-[#111827]">📄 Histórico de faturas</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB]">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase">Data</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase">Descrição</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase">Valor</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase">Status</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {INVOICES.map((inv) => {
              const st = STATUS_INVOICE[inv.status as keyof typeof STATUS_INVOICE]
              return (
                <tr key={inv.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-5 py-3.5 text-[#374151] font-medium">{inv.date}</td>
                  <td className="px-3 py-3.5 text-[#374151]">{inv.desc}</td>
                  <td className="px-3 py-3.5 font-bold text-[#111827]">R$ {inv.amount},00</td>
                  <td className="px-3 py-3.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <button className="text-xs text-[#1A3A6B] font-semibold hover:underline">
                      📥 Baixar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Cancelamento */}
      <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-5">
        <h3 className="font-semibold text-[#991B1B] mb-1">Cancelar assinatura</h3>
        <p className="text-sm text-[#7F1D1D] mb-3">
          Você pode cancelar a qualquer momento. Seu plano continua ativo até o fim do período pago.
        </p>
        <button className="text-sm font-semibold text-[#DC2626] border border-[#FECACA] px-4 py-2 rounded-xl hover:bg-[#FEE2E2] transition-colors">
          Solicitar cancelamento
        </button>
      </div>
    </div>
  )
}
