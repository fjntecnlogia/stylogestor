'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useToast } from '@/components/ui/toast'
import { PortalButton } from '@/components/ui/portal-button'
import { PromoCodeInput } from '@/components/promo/promo-code-input'

// ── Modal WhatsApp QR Code ──────────────────────────────────────
function WhatsAppModal({ onClose }: { onClose: () => void }) {
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'qr' | 'connected' | 'error' | 'waiting'>('loading')
  const [msg, setMsg] = useState('Iniciando conexão WhatsApp...')
  const [countdown, setCountdown] = useState(60)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (countRef.current) { clearInterval(countRef.current); countRef.current = null }
  }

  const startPolling = () => {
    stopPolling()
    setCountdown(60)
    // Polling do webhook store (a cada 3s)
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch('/api/whatsapp/webhook')
        const d = await r.json()
        if (d.status === 'connected') {
          stopPolling(); setStatus('connected'); setMsg('WhatsApp conectado!')
        } else if (d.status === 'qr' && d.qrcode) {
          setQrcode(d.qrcode); setStatus('qr'); setMsg('Escaneie com o WhatsApp do celular')
        }
      } catch {}
    }, 3000)
    // Countdown visual
    countRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { stopPolling(); setStatus('error'); setMsg('QR code expirou. Tente novamente.'); return 0 } return c - 1 })
    }, 1000)
  }

  const initWhatsApp = async () => {
    setStatus('loading')
    setMsg('Iniciando conexão...')
    setQrcode(null)
    try {
      // Verificar estado atual
      const r = await fetch('/api/whatsapp/qr')
      const d = await r.json()
      if (d.status === 'connected') { setStatus('connected'); setMsg('WhatsApp já está conectado!'); return }
      if (d.status === 'qr' && d.qrcode) { setQrcode(d.qrcode); setStatus('qr'); setMsg('Escaneie com o WhatsApp do celular'); startPolling(); return }
      // Aguardar QR via webhook
      setStatus('waiting')
      setMsg('Aguardando QR code... (pode levar 15-30 segundos)')
      startPolling()
    } catch {
      setStatus('error')
      setMsg('Erro de conexão.')
    }
  }

  useEffect(() => { initWhatsApp(); return stopPolling }, [])

  const fetchQR = initWhatsApp

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <button onClick={onClose} className="absolute top-3 right-4 text-[#9CA3AF] hover:text-[#374151] text-2xl">×</button>
        <p className="text-3xl mb-2">💬</p>
        <h3 className="font-sora font-bold text-[#1C1C2E] text-lg mb-1">Conectar WhatsApp</h3>
        <p className="text-xs text-[#6B7280] mb-4">{msg}</p>

        {(status === 'loading' || status === 'waiting') && (
          <div className="py-6 space-y-3">
            <div className="flex justify-center">
              <div className="w-10 h-10 border-4 border-[#25D366] border-t-transparent rounded-full animate-spin" />
            </div>
            {status === 'waiting' && (
              <p className="text-xs text-[#6B7280]">Aguardando: {countdown}s</p>
            )}
          </div>
        )}

        {status === 'qr' && qrcode && (
          <div className="space-y-4">
            <img src={qrcode} alt="QR Code WhatsApp" className="w-56 h-56 mx-auto rounded-xl border-4 border-[#25D366]/20" />
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3 text-xs text-[#166534] text-left">
              <p className="font-semibold mb-1">Como conectar:</p>
              <p>1. Abra o WhatsApp no celular</p>
              <p>2. Menu → Aparelhos conectados → Conectar aparelho</p>
              <p>3. Aponte a câmera para o QR code</p>
            </div>
            <button onClick={fetchQR} className="text-xs text-[#6B7280] hover:text-[#374151] underline">
              🔄 Atualizar QR code
            </button>
          </div>
        )}

        {status === 'connected' && (
          <div className="py-6">
            <p className="text-5xl mb-3">✅</p>
            <p className="font-bold text-[#1B8A5A]">WhatsApp conectado!</p>
            <p className="text-xs text-[#6B7280] mt-1">Lembretes automáticos ativados.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3 py-4">
            <p className="text-4xl">⚠️</p>
            <button onClick={fetchQR} className="bg-[#1A3A6B] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#142d55]">
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

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

interface CompanyForm {
  name: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  logo: string
}

export function ConfiguracoesView() {
  const [tab, setTab] = useState<'negocio' | 'horarios' | 'plano' | 'integracao'>('negocio')
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [whatsappModal, setWhatsappModal] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const { success, error } = useToast()
  const { user, isLoaded } = useUser()

  // Form controlado de dados da barbearia (Negócio tab)
  const [company, setCompany] = useState<CompanyForm>({
    name: '', phone: '', email: '', address: '', city: '', state: '', logo: '',
  })
  const [savingCompany, setSavingCompany] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Hidrata os dados da barbearia ao montar
  useEffect(() => {
    let cancelled = false
    fetch('/api/me/tenant')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        if (cancelled) return
        setCompany({
          name: data.name ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          logo: data.logo ?? '',
        })
      })
      .catch(() => { /* silencioso — form fica vazio se falhar */ })
  }, [])

  const handleSaveCompany = async () => {
    if (!company.name.trim()) {
      error('Nome da barbearia é obrigatório')
      return
    }
    setSavingCompany(true)
    try {
      const res = await fetch('/api/me/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      })
      const updated = await res.json()
      if (!res.ok) { error(updated.error || 'Erro ao salvar'); return }
      setCompany((prev) => ({ ...prev, ...updated }))
      success('Dados da barbearia salvos! ✓')
    } catch (err) {
      error('Erro de conexão')
      console.error(err)
    } finally {
      setSavingCompany(false)
    }
  }

  // Upload de logo: por enquanto converte pra base64 e salva no campo
  // tenant.logo (string). Quando o módulo de storage chegar (S3/Cloudflare R2),
  // trocar por upload de verdade e guardar a URL pública.
  const handleLogoUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      error('Arquivo muito grande. Máximo 2MB.')
      return
    }
    setUploadingLogo(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      // Persiste imediatamente — logo upload já vale como save
      const res = await fetch('/api/me/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: dataUrl }),
      })
      const updated = await res.json()
      if (!res.ok) { error(updated.error || 'Erro ao salvar logo'); return }
      setCompany((prev) => ({ ...prev, logo: updated.logo ?? dataUrl }))
      success(`Logo "${file.name}" salva!`)
    } catch (err) {
      error('Erro ao fazer upload')
      console.error(err)
    } finally {
      setUploadingLogo(false)
    }
  }

  // Slug do tenant vem do Clerk publicMetadata (setado pelo webhook do Stripe no signup).
  // Se ainda não estiver disponível, mostra placeholder bem-comunicado.
  const tenantSlug = (user?.publicMetadata as { tenantSlug?: string } | undefined)?.tenantSlug
  const slug = tenantSlug || (isLoaded ? 'sua-barbearia' : '...')
  const linkAgendamento = tenantSlug
    ? `https://${tenantSlug}.stylogestor.com.br`
    : 'https://sua-barbearia.stylogestor.com.br'

  const handleCopyLink = () => {
    if (!tenantSlug) {
      error('Sua barbearia ainda não tem um endereço configurado. Conclua o cadastro primeiro.')
      return
    }
    navigator.clipboard.writeText(linkAgendamento)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
    success('Link copiado!')
  }

  const toggleDay = (day: number) =>
    setHours((h) => h.map((d) => d.day === day ? { ...d, active: !d.active } : d))

  const updateHourField = (day: number, field: 'start' | 'end', value: string) =>
    setHours((h) => h.map((d) => d.day === day ? { ...d, [field]: value } : d))

  // Hidrata horários do banco no mount
  useEffect(() => {
    let cancelled = false
    fetch('/api/me/business-schedule')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return
        setHours(data)
      })
      .catch(() => { /* silencioso — fica com DEFAULT_HOURS */ })
    return () => { cancelled = true }
  }, [])

  const [savingHours, setSavingHours] = useState(false)
  const handleSaveHours = async () => {
    setSavingHours(true)
    try {
      const res = await fetch('/api/me/business-schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: hours }),
      })
      const data = await res.json()
      if (!res.ok) { error(data.error || 'Erro ao salvar horários'); return }
      success('Horários de funcionamento salvos! ✓')
    } catch (err) {
      error('Erro de conexão')
      console.error(err)
    } finally {
      setSavingHours(false)
    }
  }

  return (
    <>
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
              {([
                { key: 'name',    label: 'Nome da barbearia', placeholder: 'Barbearia do João', type: 'text' },
                { key: 'phone',   label: 'Telefone',          placeholder: '(11) 99999-9999',   type: 'tel' },
                { key: 'email',   label: 'E-mail',            placeholder: 'contato@barbearia.com', type: 'email' },
                { key: 'address', label: 'Endereço',          placeholder: 'Rua das Flores, 123', type: 'text' },
                { key: 'city',    label: 'Cidade',            placeholder: 'São Paulo',           type: 'text' },
                { key: 'state',   label: 'Estado',            placeholder: 'SP',                  type: 'text' },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-[#4A4A5A] block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={company[f.key]}
                    onChange={(e) => setCompany((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full border border-[#E8E6E2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-[#4A4A5A] block mb-1">Logo da barbearia</label>
              <label className={`border-2 border-dashed border-[#E8E6E2] rounded-xl p-6 text-center cursor-pointer hover:border-[#1A3A6B]/40 transition-colors block ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  disabled={uploadingLogo}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleLogoUpload(file)
                    e.target.value = '' // permite re-upload do mesmo arquivo
                  }}
                />
                {company.logo ? (
                  <div className="flex flex-col items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={company.logo} alt="Logo" className="max-h-20 object-contain" />
                    <p className="text-xs text-[#4A4A5A]">Clique para trocar</p>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl mb-2">🖼️</p>
                    <p className="text-sm text-[#4A4A5A]">
                      {uploadingLogo ? 'Enviando...' : 'Clique para fazer upload da logo'}
                    </p>
                    <p className="text-xs text-[#4A4A5A]/60">PNG, JPG ou SVG até 2MB</p>
                  </>
                )}
              </label>
            </div>
            <button
              onClick={handleSaveCompany}
              disabled={savingCompany}
              className="bg-[#1A3A6B] disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#142d55] transition-colors"
            >
              {savingCompany ? 'Salvando...' : 'Salvar alterações'}
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
                        <input
                          type="time"
                          value={h.start}
                          onChange={(e) => updateHourField(key, 'start', e.target.value)}
                          className="border border-[#E8E6E2] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A6B]"
                        />
                        <span className="text-[#4A4A5A] text-sm">até</span>
                        <input
                          type="time"
                          value={h.end}
                          onChange={(e) => updateHourField(key, 'end', e.target.value)}
                          className="border border-[#E8E6E2] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A6B]"
                        />
                      </div>
                    )}
                    {!h.active && <span className="text-sm text-[#4A4A5A] flex-1">Fechado</span>}
                  </div>
                )
              })}
            </div>
            <button
              onClick={handleSaveHours}
              disabled={savingHours}
              className="bg-[#1A3A6B] disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#142d55] transition-colors"
            >
              {savingHours ? 'Salvando...' : 'Salvar horários'}
            </button>
          </div>
        )}

        {tab === 'plano' && (
          <div className="space-y-4">
            <div className="bg-[#1B8A5A]/10 border border-[#1B8A5A]/20 rounded-2xl p-4">
              <p className="text-sm font-semibold text-[#1B8A5A]">✅ Você está no Plano Pro</p>
              <p className="text-xs text-[#4A4A5A] mt-1">Próxima cobrança: 10/06/2026 · R$ 149,00</p>
            </div>

            {/* Resgate de código promocional — dá dias extras de trial */}
            <PromoCodeInput />

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
            {/* WhatsApp */}
            <div className="bg-white rounded-2xl border border-[#E8E6E2] p-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-4">
                <span className="text-3xl">💬</span>
                <div>
                  <p className="font-semibold text-[#1C1C2E]">WhatsApp Business</p>
                  <p className="text-xs text-[#4A4A5A]">Envie confirmações e lembretes automáticos</p>
                  <p className="text-xs mt-0.5 font-medium text-[#4A4A5A]">Não conectado</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsappModal(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 bg-[#25D366] text-white hover:bg-[#1ea855] transition-colors"
              >
                💬 Conectar
              </button>
            </div>

            {/* Resend Email */}
            <div className="bg-white rounded-2xl border border-[#E8E6E2] p-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-4">
                <span className="text-3xl">📧</span>
                <div>
                  <p className="font-semibold text-[#1C1C2E]">Resend (Email)</p>
                  <p className="text-xs text-[#4A4A5A]">Envie e-mails transacionais aos clientes</p>
                  <p className="text-xs mt-0.5 font-medium text-[#1B8A5A]">✓ Configurado</p>
                </div>
              </div>
              <button
                onClick={() => { success('Email configurado! Clientes receberão confirmações automáticas.') }}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 border border-[#E8E6E2] text-[#4A4A5A] hover:bg-[#F8F6F2] transition-colors"
              >
                Configurar
              </button>
            </div>

            {/* Link de agendamento */}
            <div className="bg-white rounded-2xl border border-[#E8E6E2] p-5 gap-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🔗</span>
                  <div>
                    <p className="font-semibold text-[#1C1C2E]">Link de agendamento</p>
                    <p className="text-xs text-[#4A4A5A]">Compartilhe com seus clientes</p>
                    <p className="text-xs mt-0.5 font-medium text-[#1B8A5A]">✓ {slug}.stylogestor.com.br</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#E8E6E2] text-[#4A4A5A] hover:bg-[#F8F6F2] transition-colors"
                  >
                    {linkCopied ? '✓ Copiado!' : '📋 Copiar link'}
                  </button>
                  <a
                    href={linkAgendamento}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#1A3A6B] text-white hover:bg-[#142d55] transition-colors"
                  >
                    🔗 Abrir
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Agende seu horário: ${linkAgendamento}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#25D366] text-white hover:opacity-90 transition-opacity"
                  >
                    💬 Compartilhar
                  </a>
                </div>
              </div>
            </div>

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
                    try {
                      const res = await fetch('/api/stripe/connect/onboard', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tenantName: 'Minha Barbearia', email: '' }),
                      })
                      const data = await res.json()
                      if (data.url) window.location.href = data.url
                      else if (data.error) alert('Erro: ' + data.error)
                    } catch { alert('Erro ao conectar com Stripe. Tente novamente.') }
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

    {/* Modal WhatsApp QR Code */}
    {whatsappModal && <WhatsAppModal onClose={() => setWhatsappModal(false)} />}
    </>
  )
}
