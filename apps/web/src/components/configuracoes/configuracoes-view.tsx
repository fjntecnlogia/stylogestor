'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/toast'
import { PortalButton } from '@/components/ui/portal-button'

const PLANOS = [
  { id: 'STARTER', name: 'Starter', price: 79,  desc: '1 profissional · Agenda + Clientes' },
  { id: 'PRO',     name: 'Pro',     price: 149, desc: 'Até 5 profissionais · + Financeiro + WhatsApp', current: true },
  { id: 'PREMIUM', name: 'Premium', price: 249, desc: 'Ilimitado · + Estoque + Relatórios avançados' },
]

const DIAS_SEMANA = [
  { key: 0, label: 'Dom' }, { key: 1, label: 'Seg' }, { key: 2, label: 'Ter' },
  { key: 3, label: 'Qua' }, { key: 4, label: 'Qui' }, { key: 5, label: 'Sex' }, { key: 6, label: 'Sab' },
]

const DEFAULT_HOURS = [
  { day: 1, start: '09:00', end: '19:00', active: true },
  { day: 2, start: '09:00', end: '19:00', active: true },
  { day: 3, start: '09:00', end: '19:00', active: true },
  { day: 4, start: '09:00', end: '19:00', active: true },
  { day: 5, start: '09:00', end: '19:00', active: true },
  { day: 6, start: '09:00', end: '17:00', active: true },
  { day: 0, start: '09:00', end: '13:00', active: false },
]

export function ConfiguracoesView() {
  const [tab, setTab] = useState<'negocio' | 'horarios' | 'plano' | 'integracao'>('negocio')
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const { success, error } = useToast()

  const toggleDay = (day: number) =>
    setHours((h) => h.map((d) => d.day === day ? { ...d, active: !d.active } : d))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Menu lateral */}
      <div className="bg-white rounded-2xl border border-[#E8E6E2] p-2 h-fit">
        {[
          { key: 'negocio',    label: '🏪 Meu negócio' },
          { key: 'horarios',   label: '🕐 Horários' },
          { key: 'plano',      label: '💎 Plano' },
          { key: 'integracao', label: '📱 Integrações' },
        ].map((item) => (
          <button key={item.key} onClick={() => setTab(item.key as typeof tab)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
              tab === item.key ? 'bg-[#1A3A6B] text-white font-medium' : 'text-[#4A4A5A] hover:bg-[#F8F6F2]'
            }`}>
            {item.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="lg:col-span-3 space-y-4">

        {tab === 'negocio' && (
          <div className="bg-white rounded-2xl border border-[#E8E6E2] p-6 space-y-5">
            <h3 className="font-sora font-bold text-[#1C1C2E]">Dados da barbearia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Nome da barbearia', placeholder: 'Barbearia do João', type: 'text' },
                { label: 'Telefone', placeholder: '(11) 99999-9999', type: 'tel' },
                { label: 'E-mail', placeholder: 'contato@barbearia.com', type: 'email' },
                { label: 'Endereço', placeholder: 'Rua das Flores, 123', type: 'text' },
                { label: 'Cidade', placeholder: 'São Paulo', type: 'text' },
                { label: 'Estado', placeholder: 'SP', type: 'text' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-[#4A4A5A] block mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    className="w-full border border-[#E8E6E2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-[#4A4A5A] block mb-1">Logo da barbearia</label>
              <label className="border-2 border-dashed border-[#E8E6E2] rounded-xl p-6 text-center cursor-pointer hover:border-[#1A3A6B]/40 transition-colors block">
                <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && file.size > 2 * 1024 * 1024) { error('Arquivo muito grande. Máximo 2MB.'); return }
                    if (file) success(`Logo "${file.name}" selecionada! Salve para aplicar.`)
                  }} />
                <p className="text-3xl mb-2">🖼️</p>
                <p className="text-sm text-[#4A4A5A]">Clique para fazer upload da logo</p>
                <p className="text-xs text-[#4A4A5A]/60">PNG, JPG ou SVG até 2MB</p>
              </label>
            </div>
            <button
              onClick={() => success('Configurações salvas com sucesso!')}
              className="bg-[#1A3A6B] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#142d55] transition-colors"
            >
              Salvar alterações
            </button>
          </div>
        )}

        {tab === 'horarios' && (
          <div className="bg-white rounded-2xl border border-[#E8E6E2] p-6 space-y-4">
            <h3 className="font-sora font-bold text-[#1C1C2E]">Horários de funcionamento</h3>
            <p className="text-sm text-[#4A4A5A]">Configure os dias e horários em que sua barbearia atende.</p>
            <div className="space-y-3">
              {DIAS_SEMANA.map(({ key, label }) => {
                const h = hours.find((d) => d.day === key)!
                return (
                  <div key={key} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${h.active ? 'border-[#1A3A6B]/20 bg-[#1A3A6B]/2' : 'border-[#E8E6E2] opacity-50'}`}>
                    <button onClick={() => toggleDay(key)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${h.active ? 'bg-[#1A3A6B]' : 'bg-[#E8E6E2]'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.active ? 'left-5' : 'left-1'}`}></span>
                    </button>
                    <span className="font-medium text-sm text-[#1C1C2E] w-8">{label}</span>
                    {h.active && (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="time" defaultValue={h.start}
                          className="border border-[#E8E6E2] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A6B]" />
                        <span className="text-[#4A4A5A] text-sm">até</span>
                        <input type="time" defaultValue={h.end}
                          className="border border-[#E8E6E2] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A6B]" />
                      </div>
                    )}
                    {!h.active && <span className="text-sm text-[#4A4A5A] flex-1">Fechado</span>}
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => success('Horários de funcionamento salvos!')}
              className="bg-[#1A3A6B] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#142d55] transition-colors"
            >
              Salvar horários
            </button>
          </div>
        )}

        {tab === 'plano' && (
          <div className="space-y-4">
            <div className="bg-[#1B8A5A]/10 border border-[#1B8A5A]/20 rounded-2xl p-4">
              <p className="text-sm font-semibold text-[#1B8A5A]">✅ Você está no Plano Pro</p>
              <p className="text-xs text-[#4A4A5A] mt-1">Próxima cobrança: 10/06/2026 · R$ 149,00</p>
            </div>
            {PLANOS.map((p) => (
              <div key={p.id} className={`bg-white rounded-2xl border p-5 flex items-center justify-between ${p.current ? 'border-[#1A3A6B]' : 'border-[#E8E6E2]'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-sora font-bold text-[#1C1C2E]">{p.name}</p>
                    {p.current && <span className="text-[10px] bg-[#1A3A6B] text-white px-2 py-0.5 rounded-full font-semibold">ATUAL</span>}
                  </div>
                  <p className="text-xs text-[#4A4A5A] mt-0.5">{p.desc}</p>
                </div>
                <div className="text-right">
                  <p className="font-sora font-bold text-xl text-[#1A3A6B]">R$ {p.price}<span className="text-xs font-normal text-[#4A4A5A]">/mês</span></p>
                  {!p.current && (
                    <a
                      href="/planos"
                      className="inline-block text-xs border border-[#1A3A6B] text-[#1A3A6B] px-3 py-1 rounded-lg mt-1 hover:bg-[#1A3A6B]/5 transition-colors"
                    >
                      {p.price > 149 ? 'Fazer upgrade' : 'Fazer downgrade'}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'integracao' && (
          <div className="space-y-4">
            {/* Integrações padrão */}
            {[
              { icon: '💬', name: 'WhatsApp Business', desc: 'Envie confirmações e lembretes automáticos', status: 'Não conectado', connected: false },
              { icon: '📧', name: 'Resend (Email)', desc: 'Envie e-mails transacionais aos clientes', status: 'Configurado', connected: true },
              { icon: '🔗', name: 'Link de agendamento', desc: 'Compartilhe seu link de agendamento online', status: 'joao-barber.stylogestor.com.br', connected: true },
            ].map((item) => (
              <div key={item.name} className="bg-white rounded-2xl border border-[#E8E6E2] p-5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-[#1C1C2E]">{item.name}</p>
                    <p className="text-xs text-[#4A4A5A]">{item.desc}</p>
                    <p className={`text-xs mt-0.5 font-medium ${item.connected ? 'text-[#1B8A5A]' : 'text-[#4A4A5A]'}`}>
                      {item.connected ? '✓ ' : ''}{item.status}
                    </p>
                  </div>
                </div>
                <button className={`text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 ${
                  item.connected ? 'border border-[#E8E6E2] text-[#4A4A5A] hover:bg-[#F8F6F2]' : 'bg-[#1A3A6B] text-white hover:bg-[#142d55]'
                }`}>
                  {item.connected ? 'Configurar' : 'Conectar'}
                </button>
              </div>
            ))}

            {/* Stripe Connect — Add-on opcional */}
            <div className="bg-white rounded-2xl border-2 border-[#1A3A6B]/20 overflow-hidden">
              <div className="bg-[#1A3A6B] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  <p className="font-sora font-bold text-white text-sm">Pagamentos online dos clientes</p>
                </div>
                <span className="text-[10px] bg-[#F5A623] text-[#1A3A6B] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Add-on · Pro/Premium</span>
              </div>
              <div className="p-5">
                <p className="text-sm text-[#374151] mb-3">
                  Permita que seus clientes <strong>paguem online</strong> na hora do agendamento. O dinheiro cai diretamente na sua conta bancária.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {[
                    { icon: '⚡', title: 'PIX instantâneo', desc: 'Clientes pagam via PIX na hora' },
                    { icon: '💳', title: 'Cartão online', desc: 'Débito e crédito pelo link' },
                    { icon: '📊', title: 'Relatório completo', desc: 'Todos os recebimentos centralizados' },
                  ].map((f) => (
                    <div key={f.title} className="bg-[#F9FAFB] rounded-xl p-3 text-center">
                      <p className="text-xl mb-1">{f.icon}</p>
                      <p className="font-semibold text-xs text-[#111827]">{f.title}</p>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{f.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#FEF9C3] border border-[#FCD34D] rounded-xl p-3 mb-4 text-xs text-[#92400E]">
                  <p className="font-semibold mb-0.5">💡 Como funciona a cobrança:</p>
                  <p>O STYLOGESTOR retém <strong>2% de taxa</strong> por transação processada. O restante vai direto para sua conta. Sem mensalidade extra.</p>
                </div>

                <button
                  onClick={async () => {
                    const res = await fetch('/api/stripe/connect/onboard', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ tenantName: (document.querySelector('input[placeholder="Barbearia do João"]') as HTMLInputElement)?.value || 'Minha Barbearia', email: (document.querySelector('input[type="email"]') as HTMLInputElement)?.value || '' }),
                    })
                    const data = await res.json()
                    if (data.url) window.location.href = data.url
                  }}
                  className="w-full bg-[#1A3A6B] text-white font-bold py-3 rounded-xl hover:bg-[#142d55] transition-colors text-sm"
                >
                  🔗 Conectar minha conta bancária via Stripe
                </button>
                <p className="text-xs text-[#9CA3AF] text-center mt-2">
                  Processo seguro. Leva menos de 5 minutos. Dados protegidos pelo Stripe.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
