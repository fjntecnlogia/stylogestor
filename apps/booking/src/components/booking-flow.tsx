'use client'

import { useState } from 'react'

const MOCK_TENANT = {
  name: 'Barbearia do João',
  address: 'Rua das Flores, 123 — São Paulo, SP',
  hours: 'Seg–Sex 09h–19h · Sab 09h–17h',
  rating: 4.9,
  reviews: 128,
  whatsapp: '65996952828',
}

const SERVICES = [
  { id: '1', name: 'Corte masculino', duration: 30, price: 40 },
  { id: '2', name: 'Barba',           duration: 30, price: 30 },
  { id: '3', name: 'Corte + Barba',   duration: 45, price: 60 },
  { id: '4', name: 'Pigmentação',     duration: 60, price: 80 },
  { id: '5', name: 'Hidratação',      duration: 45, price: 70 },
]

const PROFESSIONALS = [
  { id: '1', name: 'João Silva',   role: 'Barbeiro' },
  { id: '2', name: 'Pedro Costa',  role: 'Cabeleireiro' },
  { id: '0', name: 'Sem preferência', role: 'Qualquer profissional' },
]

const SLOTS = ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30','16:00','16:30']
const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i + 1)
  return d
})

type Step = 'services' | 'professional' | 'datetime' | 'info' | 'confirm' | 'success'

interface Props { slug: string }

export function BookingFlow({ slug }: Props) {
  const [step, setStep] = useState<Step>('services')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [professional, setProfessional] = useState('')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)

  const totalPrice = SERVICES.filter((s) => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.price, 0)
  const totalDuration = SERVICES.filter((s) => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.duration, 0)

  const stepNum = { services: 1, professional: 2, datetime: 3, info: 4, confirm: 5, success: 6 }[step]

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const selectedProf = MOCK_PROFESSIONALS.find(p => p.id === professional)
      const selectedSvcs = MOCK_SERVICES.filter(s => selectedServices.includes(s.id))

      const body = {
        slug,
        clientName: name,
        clientPhone: phone.replace(/\D/g, ''),
        services: selectedServices,
        professionalId: professional,
        date: selectedDay?.toISOString().split('T')[0],
        time: selectedSlot,
        totalPrice,
        totalDuration,
      }

      // Salvar agendamento
      const res = await fetch(`/api/booking/${slug}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => null)

      const data = await res?.json().catch(() => ({}))
      if (data?.id) setBookingId(data.id)

      // Disparar automação (WhatsApp + Email) sem bloquear
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'
      fetch(`${appUrl}/api/automations/appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'confirmation',
          appointment: {
            clientName:       name,
            clientPhone:      phone.replace(/\D/g, ''),
            clientEmail:      '',
            date:             selectedDay?.toISOString(),
            time:             selectedSlot,
            serviceName:      selectedSvcs.map(s => s.name).join(', '),
            professionalName: selectedProf?.name ?? '',
            barbershopName:   MOCK_TENANT.name,
          },
        }),
      }).catch(() => {})

      setStep('success')
    } catch {
      setStep('success')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      {/* Header da barbearia */}
      <div className="bg-[#1A3A6B] text-white">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#F5A623] rounded-xl flex items-center justify-center font-sora font-extrabold text-[#1A3A6B] text-xl">S</div>
            <div>
              <h1 className="font-sora font-bold text-lg">{MOCK_TENANT.name}</h1>
              <p className="text-white/60 text-xs">{MOCK_TENANT.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
            <span>⭐ {MOCK_TENANT.rating} ({MOCK_TENANT.reviews} avaliações)</span>
            <span>🕐 {MOCK_TENANT.hours}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {step !== 'success' && (
        <div className="bg-white border-b border-[#E8E6E2]">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map((n) => (
                <div key={n} className="flex items-center gap-2 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    n < stepNum ? 'bg-[#1B8A5A] text-white' : n === stepNum ? 'bg-[#1A3A6B] text-white' : 'bg-[#E8E6E2] text-[#4A4A5A]'
                  }`}>{n < stepNum ? '✓' : n}</div>
                  {n < 5 && <div className={`h-1 flex-1 rounded ${n < stepNum ? 'bg-[#1B8A5A]' : 'bg-[#E8E6E2]'}`}></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* STEP 1 — Serviços */}
        {step === 'services' && (
          <>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E]">Escolha os serviços</h2>
            <div className="space-y-2">
              {SERVICES.map((s) => {
                const sel = selectedServices.includes(s.id)
                return (
                  <button key={s.id} onClick={() => setSelectedServices((prev) => sel ? prev.filter((id) => id !== s.id) : [...prev, s.id])}
                    className={`w-full text-left p-4 rounded-2xl border flex justify-between items-center transition-all ${sel ? 'border-[#1A3A6B] bg-[#1A3A6B]/5' : 'border-[#E8E6E2] bg-white hover:border-[#1A3A6B]/40'}`}>
                    <div>
                      <p className="font-medium text-[#1C1C2E]">{s.name}</p>
                      <p className="text-xs text-[#4A4A5A] mt-0.5">⏱ {s.duration} minutos</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1A3A6B]">R$ {s.price}</p>
                      {sel && <p className="text-xs text-[#1B8A5A]">✓</p>}
                    </div>
                  </button>
                )
              })}
            </div>
            {selectedServices.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E8E6E2] p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-[#4A4A5A]">{selectedServices.length} serviço(s) · {totalDuration} min</p>
                  <p className="font-bold text-[#1A3A6B]">Total: R$ {totalPrice}</p>
                </div>
                <button onClick={() => setStep('professional')} className="bg-[#1A3A6B] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#142d55]">
                  Próximo →
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP 2 — Profissional */}
        {step === 'professional' && (
          <>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E]">Escolha o profissional</h2>
            <div className="space-y-2">
              {PROFESSIONALS.map((p) => (
                <button key={p.id} onClick={() => setProfessional(p.id)}
                  className={`w-full text-left p-4 rounded-2xl border flex items-center gap-4 transition-all ${professional === p.id ? 'border-[#1A3A6B] bg-[#1A3A6B]/5' : 'border-[#E8E6E2] bg-white hover:border-[#1A3A6B]/40'}`}>
                  <div className="w-10 h-10 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white font-bold shrink-0">
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#1C1C2E]">{p.name}</p>
                    <p className="text-xs text-[#4A4A5A]">{p.role}</p>
                  </div>
                  {professional === p.id && <span className="text-[#1B8A5A] font-bold">✓</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('services')} className="flex-1 border border-[#E8E6E2] text-[#4A4A5A] py-2.5 rounded-xl font-medium">← Voltar</button>
              <button disabled={!professional} onClick={() => setStep('datetime')} className="flex-1 bg-[#1A3A6B] disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl hover:bg-[#142d55]">Próximo →</button>
            </div>
          </>
        )}

        {/* STEP 3 — Data e Hora */}
        {step === 'datetime' && (
          <>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E]">Escolha a data e horário</h2>
            <div className="bg-white rounded-2xl border border-[#E8E6E2] p-4">
              <p className="text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide mb-3">Dias disponíveis</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {DAYS.map((d) => {
                  const sel = selectedDay?.toDateString() === d.toDateString()
                  return (
                    <button key={d.toISOString()} onClick={() => setSelectedDay(d)}
                      className={`flex flex-col items-center p-3 rounded-xl border min-w-[56px] transition-all ${sel ? 'border-[#1A3A6B] bg-[#1A3A6B] text-white' : 'border-[#E8E6E2] hover:border-[#1A3A6B]/40'}`}>
                      <span className="text-[10px] uppercase">{d.toLocaleDateString('pt-BR',{weekday:'short'})}</span>
                      <span className="font-bold text-lg">{d.getDate()}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            {selectedDay && (
              <div className="bg-white rounded-2xl border border-[#E8E6E2] p-4">
                <p className="text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide mb-3">Horários livres</p>
                <div className="grid grid-cols-4 gap-2">
                  {SLOTS.map((slot) => (
                    <button key={slot} onClick={() => setSelectedSlot(slot)}
                      className={`py-2 rounded-xl border text-sm font-medium transition-all ${selectedSlot === slot ? 'border-[#1A3A6B] bg-[#1A3A6B] text-white' : 'border-[#E8E6E2] hover:border-[#1A3A6B]/40'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep('professional')} className="flex-1 border border-[#E8E6E2] text-[#4A4A5A] py-2.5 rounded-xl font-medium">← Voltar</button>
              <button disabled={!selectedDay || !selectedSlot} onClick={() => setStep('info')} className="flex-1 bg-[#1A3A6B] disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl hover:bg-[#142d55]">Próximo →</button>
            </div>
          </>
        )}

        {/* STEP 4 — Dados pessoais */}
        {step === 'info' && (
          <>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E]">Seus dados</h2>
            <div className="bg-white rounded-2xl border border-[#E8E6E2] p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-[#4A4A5A] block mb-1">Nome completo *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome"
                  className="w-full border border-[#E8E6E2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#4A4A5A] block mb-1">WhatsApp *</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999"
                  className="w-full border border-[#E8E6E2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
              </div>
              <label className="flex items-center gap-2 text-sm text-[#4A4A5A] cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-[#1A3A6B]" />
                Quero receber lembretes pelo WhatsApp
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('datetime')} className="flex-1 border border-[#E8E6E2] text-[#4A4A5A] py-2.5 rounded-xl font-medium">← Voltar</button>
              <button disabled={!name || !phone} onClick={() => setStep('confirm')} className="flex-1 bg-[#1A3A6B] disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl hover:bg-[#142d55]">Revisar →</button>
            </div>
          </>
        )}

        {/* STEP 5 — Confirmação */}
        {step === 'confirm' && (
          <>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E]">Confirme seu agendamento</h2>
            <div className="bg-white rounded-2xl border border-[#E8E6E2] p-5 space-y-3">
              {[
                { label: 'Cliente',      value: name },
                { label: 'WhatsApp',     value: phone },
                { label: 'Serviços',     value: SERVICES.filter((s) => selectedServices.includes(s.id)).map((s) => s.name).join(', ') },
                { label: 'Profissional', value: PROFESSIONALS.find((p) => p.id === professional)?.name },
                { label: 'Data',         value: selectedDay?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) },
                { label: 'Horário',      value: selectedSlot },
                { label: 'Duração',      value: `${totalDuration} minutos` },
                { label: 'Total',        value: `R$ ${totalPrice}`, bold: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-start">
                  <span className="text-sm text-[#4A4A5A]">{row.label}</span>
                  <span className={`text-sm text-right ml-4 ${row.bold ? 'font-bold text-[#1A3A6B]' : 'font-medium text-[#1C1C2E]'} capitalize`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('info')} className="flex-1 border border-[#E8E6E2] text-[#4A4A5A] py-2.5 rounded-xl font-medium">← Voltar</button>
              <button onClick={handleConfirm} disabled={submitting} className="flex-1 bg-[#1B8A5A] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl hover:bg-[#156b47]">
                {submitting ? '⏳ Confirmando...' : '✓ Confirmar agendamento'}
              </button>
            </div>
          </>
        )}

        {/* STEP 6 — Sucesso */}
        {step === 'success' && (
          <div className="text-center py-10 space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="font-sora font-bold text-2xl text-[#1C1C2E]">Agendado com sucesso!</h2>
            <p className="text-[#4A4A5A]">Você receberá uma confirmação pelo WhatsApp em breve.</p>
            <div className="bg-white rounded-2xl border border-[#E8E6E2] p-5 text-left space-y-2 max-w-sm mx-auto">
              <p className="text-sm"><span className="text-[#4A4A5A]">Data: </span><strong className="capitalize">{selectedDay?.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</strong></p>
              <p className="text-sm"><span className="text-[#4A4A5A]">Horário: </span><strong>{selectedSlot}</strong></p>
              <p className="text-sm"><span className="text-[#4A4A5A]">Local: </span><strong>{MOCK_TENANT.address}</strong></p>
            </div>
            <p className="text-xs text-[#4A4A5A]">Precisa cancelar? Fale com a barbearia pelo WhatsApp.</p>
            <a
              href={`https://wa.me/55${MOCK_TENANT.whatsapp || '65996952828'}?text=${encodeURIComponent(`Olá! Quero cancelar meu agendamento de ${selectedSlot} do dia ${selectedDay?.toLocaleDateString('pt-BR')}. Nome: ${name}`)}`}
              target="_blank"
              className="inline-block bg-[#1B8A5A] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#156b47] transition-colors"
            >
              💬 Cancelar pelo WhatsApp
            </a>
            <br />
            <a href="https://stylogestor.com.br/ajuda" target="_blank" className="inline-block text-xs text-[#1A3A6B] font-semibold hover:underline">
              ❓ Dúvidas? Ver central de ajuda
            </a>
            <p className="text-xs text-[#1A3A6B]/50 font-medium">Powered by STYLOGESTOR</p>
          </div>
        )}
      </div>
    </div>
  )
}
