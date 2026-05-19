'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/toast'

interface TenantInfo {
  id: string; slug: string; name: string; phone: string
  address: string; city: string; state: string; logo: string
  schedules: Array<{ day: number; start: string; end: string; active: boolean }>
  bookingLeadHours: number; maxBookingDaysAhead: number
}
interface Service { id: string; name: string; description: string; price: number; duration: number; category: string }
interface Professional { id: string; name: string; role: string; avatar: string | null; bio: string }

type Step = 'services' | 'professional' | 'datetime' | 'info' | 'success'

const DIAS_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const SLOT_INTERVAL = 30 // minutos entre slots

function buildSlots(start: string, end: string): string[] {
  const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m }
  const out: string[] = []
  for (let m = toMin(start); m < toMin(end); m += SLOT_INTERVAL) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    out.push(`${hh}:${mm}`)
  }
  return out
}

export function BookingPublicFlow({ slug }: { slug: string }) {
  const { success, error } = useToast()
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState<Step>('services')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedProfId, setSelectedProfId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('') // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>('') // HH:mm
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState<{ status: string; message: string } | null>(null)

  // Hidrata tudo no mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetch(`/api/v1/booking/${slug}/info`).then((r) => r.ok ? r.json() : Promise.reject(r)),
      fetch(`/api/v1/booking/${slug}/services`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/v1/booking/${slug}/professionals`).then((r) => r.ok ? r.json() : []),
    ])
      .then(([info, svcs, profs]) => {
        if (cancelled) return
        setTenant(info)
        setServices(Array.isArray(svcs) ? svcs : [])
        setProfessionals(Array.isArray(profs) ? profs : [])
      })
      .catch(() => { /* notFound state */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F6F2] flex items-center justify-center px-4">
        <div className="text-center text-[#6B7280] text-sm">Carregando...</div>
      </main>
    )
  }
  if (!tenant) {
    return (
      <main className="min-h-screen bg-[#F8F6F2] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
          <p className="text-4xl mb-3">🔍</p>
          <h1 className="font-sora font-bold text-[#1C1C2E]">Barbearia não encontrada</h1>
          <p className="text-sm text-[#6B7280] mt-2">Confirme o link com a barbearia.</p>
        </div>
      </main>
    )
  }

  // Compute totals
  const selectedSvcs = services.filter((s) => selectedServiceIds.includes(s.id))
  const totalPrice = selectedSvcs.reduce((s, sv) => s + sv.price, 0)
  const totalDuration = selectedSvcs.reduce((s, sv) => s + sv.duration, 0)

  // Build slots disponíveis pro dia escolhido
  const slotsForDay = (() => {
    if (!selectedDate) return [] as string[]
    const dow = new Date(`${selectedDate}T12:00:00`).getDay()
    const sched = tenant.schedules.find((s) => s.day === dow && s.active)
    if (!sched) return []
    return buildSlots(sched.start, sched.end)
  })()

  // Build próximos N dias (limitado pelo maxBookingDaysAhead do tenant)
  const maxDays = Math.min(30, tenant.maxBookingDaysAhead) // 30 dias visíveis no UI
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next30Days = Array.from({ length: maxDays }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    return d
  }).filter((d) => {
    // Só dias em que a barbearia funciona
    const sched = tenant.schedules.find((s) => s.day === d.getDay())
    return sched?.active
  })

  const handleSubmit = async () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      error('Preencha nome e WhatsApp')
      return
    }
    setSubmitting(true)
    try {
      const localStart = new Date(`${selectedDate}T${selectedTime}:00`)
      const res = await fetch(`/api/v1/booking/${slug}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName, clientPhone, clientEmail,
          serviceIds: selectedServiceIds,
          professionalId: selectedProfId,
          startISO: localStart.toISOString(),
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) { error(data.error || 'Erro ao agendar'); return }
      setConfirmed({ status: data.status, message: data.message })
      setStep('success')
      success('Agendamento enviado! 🎉')
    } catch (err) {
      error('Erro de conexão. Tente novamente.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // ── UI ──────────────────────────────────────────────────────

  const stepNum = { services: 1, professional: 2, datetime: 3, info: 4, success: 5 }[step]

  return (
    <main className="min-h-screen bg-[#F8F6F2] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E6E2] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {tenant.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo} alt={tenant.name} className="w-12 h-12 rounded-xl object-contain bg-[#F8F6F2]" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#1A3A6B] flex items-center justify-center text-white font-sora font-extrabold text-xl">
              {tenant.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-sora font-bold text-[#1C1C2E] truncate">{tenant.name}</h1>
            {(tenant.city || tenant.address) && (
              <p className="text-xs text-[#6B7280] truncate">
                📍 {[tenant.address, tenant.city, tenant.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
        {/* Stepper */}
        {step !== 'success' && (
          <div className="max-w-2xl mx-auto px-4 pb-3">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    n <= stepNum ? 'bg-[#1A3A6B]' : 'bg-[#E8E6E2]'
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-[#6B7280] mt-1.5 font-medium uppercase tracking-wide">
              Passo {stepNum} de 4 — {
                step === 'services' ? 'Escolha os serviços' :
                step === 'professional' ? 'Escolha o profissional' :
                step === 'datetime' ? 'Data e horário' :
                'Seus dados'
              }
            </p>
          </div>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* STEP 1: Serviços */}
        {step === 'services' && (
          <div className="space-y-2">
            <h2 className="font-sora font-bold text-[#1C1C2E] mb-3">O que você quer?</h2>
            {services.length === 0 ? (
              <p className="text-sm text-[#6B7280] text-center py-10">Nenhum serviço cadastrado ainda.</p>
            ) : services.map((s) => {
              const isSelected = selectedServiceIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedServiceIds((p) =>
                    p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id],
                  )}
                  className={`w-full text-left bg-white rounded-2xl border-2 p-4 transition-all ${
                    isSelected ? 'border-[#1A3A6B] bg-[#1A3A6B]/5' : 'border-[#E8E6E2]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                      isSelected ? 'border-[#1A3A6B] bg-[#1A3A6B] text-white' : 'border-[#E8E6E2]'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1C1C2E]">{s.name}</p>
                      {s.description && <p className="text-xs text-[#6B7280] mt-0.5">{s.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-sm font-bold text-[#1B8A5A]">R$ {s.price}</span>
                        <span className="text-xs text-[#9CA3AF]">⏱ {s.duration}min</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* STEP 2: Profissional */}
        {step === 'professional' && (
          <div className="space-y-2">
            <h2 className="font-sora font-bold text-[#1C1C2E] mb-3">Com quem você quer ser atendido?</h2>
            {professionals.length === 0 ? (
              <p className="text-sm text-[#6B7280] text-center py-10">Nenhum profissional disponível.</p>
            ) : professionals.map((p) => {
              const isSelected = selectedProfId === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProfId(p.id)}
                  className={`w-full text-left bg-white rounded-2xl border-2 p-4 transition-all ${
                    isSelected ? 'border-[#1A3A6B] bg-[#1A3A6B]/5' : 'border-[#E8E6E2]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {p.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white font-bold text-lg">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1C1C2E] truncate">{p.name}</p>
                      <p className="text-xs text-[#6B7280] truncate">{p.role}</p>
                      {p.bio && <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{p.bio}</p>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* STEP 3: Data e horário */}
        {step === 'datetime' && (
          <div className="space-y-4">
            <h2 className="font-sora font-bold text-[#1C1C2E]">Quando você pode?</h2>

            {/* Carrossel horizontal de dias */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {next30Days.map((d) => {
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                const isSelected = selectedDate === dateStr
                return (
                  <button
                    key={dateStr}
                    onClick={() => { setSelectedDate(dateStr); setSelectedTime('') }}
                    className={`shrink-0 w-16 py-3 rounded-2xl border-2 text-center transition-all ${
                      isSelected ? 'border-[#1A3A6B] bg-[#1A3A6B] text-white' : 'border-[#E8E6E2] bg-white text-[#1C1C2E]'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase">{DIAS_LABEL[d.getDay()]}</p>
                    <p className="font-sora font-bold text-lg leading-none mt-0.5">{d.getDate()}</p>
                    <p className="text-[10px] mt-0.5 opacity-70">
                      {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Slots de horário */}
            {selectedDate && (
              <div>
                <p className="text-sm font-semibold text-[#1C1C2E] mb-2">Horários disponíveis</p>
                {slotsForDay.length === 0 ? (
                  <p className="text-sm text-[#6B7280] py-4">Nenhum horário disponível nesse dia.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slotsForDay.map((t) => {
                      const isSelected = selectedTime === t
                      return (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                            isSelected
                              ? 'border-[#1A3A6B] bg-[#1A3A6B] text-white'
                              : 'border-[#E8E6E2] bg-white text-[#1C1C2E] hover:border-[#1A3A6B]/40'
                          }`}
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                )}
                <p className="text-[10px] text-[#9CA3AF] mt-2">
                  ⓘ Pode existir conflito com outros agendamentos — confirmamos no envio.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Dados do cliente */}
        {step === 'info' && (
          <div className="space-y-3">
            <h2 className="font-sora font-bold text-[#1C1C2E]">Seus dados pra contato</h2>
            <div>
              <label className="text-xs font-semibold text-[#4A4A5A] block mb-1">Nome completo *</label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-white border border-[#E8E6E2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4A4A5A] block mb-1">WhatsApp *</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full bg-white border border-[#E8E6E2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
              />
              <p className="text-[10px] text-[#9CA3AF] mt-1">Vamos mandar o lembrete por WhatsApp ❤️</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4A4A5A] block mb-1">E-mail (opcional)</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-white border border-[#E8E6E2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4A4A5A] block mb-1">Alguma observação? (opcional)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: alergia a determinado produto, preferência específica..."
                className="w-full bg-white border border-[#E8E6E2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] resize-none"
              />
            </div>

            {/* Resumo */}
            <div className="bg-[#F0F4FF] border border-[#BFDBFE] rounded-2xl p-4 mt-2">
              <p className="text-xs font-bold text-[#1A3A6B] uppercase tracking-wide mb-2">Resumo</p>
              <p className="text-sm text-[#1C1C2E]">{selectedSvcs.map((s) => s.name).join(' + ')}</p>
              <p className="text-xs text-[#4A4A5A] mt-1">
                {professionals.find((p) => p.id === selectedProfId)?.name} ·{' '}
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} às {selectedTime}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#BFDBFE]">
                <span className="text-sm text-[#4A4A5A]">Total · {totalDuration}min</span>
                <span className="font-sora font-bold text-xl text-[#1B8A5A]">R$ {totalPrice}</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Sucesso */}
        {step === 'success' && confirmed && (
          <div className="bg-white rounded-2xl border border-[#1B8A5A]/30 p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[#ECFDF5] flex items-center justify-center text-4xl mx-auto mb-4">
              ✅
            </div>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-2">
              {confirmed.status === 'CONFIRMED' ? 'Agendamento confirmado!' : 'Agendamento enviado!'}
            </h2>
            <p className="text-sm text-[#4A4A5A] mb-5">{confirmed.message}</p>
            <div className="bg-[#F8F6F2] rounded-xl p-4 text-left text-sm space-y-1.5 mb-5">
              <p><span className="text-[#6B7280]">Serviço:</span> <span className="font-semibold">{selectedSvcs.map(s => s.name).join(' + ')}</span></p>
              <p><span className="text-[#6B7280]">Profissional:</span> <span className="font-semibold">{professionals.find(p => p.id === selectedProfId)?.name}</span></p>
              <p><span className="text-[#6B7280]">Quando:</span> <span className="font-semibold">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às {selectedTime}</span></p>
              <p><span className="text-[#6B7280]">Total:</span> <span className="font-bold text-[#1B8A5A]">R$ {totalPrice}</span></p>
            </div>
            {tenant.phone && (
              <a
                href={`https://wa.me/${tenant.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener"
                className="inline-block bg-[#25D366] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90"
              >
                💬 Falar com a barbearia
              </a>
            )}
          </div>
        )}
      </div>

      {/* Footer fixo com Voltar / Avançar */}
      {step !== 'success' && (
        <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-[#E8E6E2] shadow-lg z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                if (step === 'services') return
                if (step === 'professional') setStep('services')
                if (step === 'datetime') setStep('professional')
                if (step === 'info') setStep('datetime')
              }}
              disabled={step === 'services'}
              className="text-sm font-semibold text-[#4A4A5A] disabled:opacity-30 px-3 py-2"
            >
              ← Voltar
            </button>

            <div className="text-xs text-[#6B7280]">
              {totalPrice > 0 && (
                <>
                  <span className="font-bold text-[#1B8A5A]">R$ {totalPrice}</span>
                  {' · '}
                  <span>{totalDuration}min</span>
                </>
              )}
            </div>

            {step === 'info' ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || !clientName.trim() || !clientPhone.trim()}
                className="bg-[#1B8A5A] disabled:opacity-40 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#156b47] transition-colors"
              >
                {submitting ? 'Enviando...' : '✓ Agendar'}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (step === 'services') {
                    if (selectedServiceIds.length === 0) { error('Escolha pelo menos 1 serviço'); return }
                    setStep('professional')
                  } else if (step === 'professional') {
                    if (!selectedProfId) { error('Escolha um profissional'); return }
                    setStep('datetime')
                  } else if (step === 'datetime') {
                    if (!selectedDate || !selectedTime) { error('Escolha data e horário'); return }
                    setStep('info')
                  }
                }}
                disabled={
                  (step === 'services' && selectedServiceIds.length === 0) ||
                  (step === 'professional' && !selectedProfId) ||
                  (step === 'datetime' && (!selectedDate || !selectedTime))
                }
                className="bg-[#1A3A6B] disabled:opacity-40 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#142d55]"
              >
                Próximo →
              </button>
            )}
          </div>
        </footer>
      )}
    </main>
  )
}
