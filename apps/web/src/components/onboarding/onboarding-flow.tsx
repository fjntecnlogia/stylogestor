'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 1 | 2 | 3 | 4

const STEPS = [
  { n: 1, label: 'Seu negócio' },
  { n: 2, label: 'Horários' },
  { n: 3, label: 'Profissional' },
  { n: 4, label: 'Serviços' },
]

const DIAS = [
  { key: 1, label: 'Segunda' }, { key: 2, label: 'Terça' }, { key: 3, label: 'Quarta' },
  { key: 4, label: 'Quinta' }, { key: 5, label: 'Sexta' }, { key: 6, label: 'Sábado' }, { key: 0, label: 'Domingo' },
]

const DEFAULT_SERVICES = [
  { id: '1', name: 'Corte masculino', price: 40, duration: 30, selected: true },
  { id: '2', name: 'Barba',           price: 30, duration: 30, selected: true },
  { id: '3', name: 'Corte + Barba',   price: 60, duration: 45, selected: true },
  { id: '4', name: 'Pigmentação',     price: 80, duration: 60, selected: false },
  { id: '5', name: 'Hidratação',      price: 70, duration: 45, selected: false },
]

export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [type, setType] = useState('barbershop')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [schedules, setSchedules] = useState(
    DIAS.map((d) => ({ day: d.key, active: d.key !== 0, start: '09:00', end: d.key === 6 ? '17:00' : '19:00' }))
  )
  const [profName, setProfName] = useState('')
  const [profRole, setProfRole] = useState('Barbeiro')
  const [commission, setCommission] = useState('40')
  const [services, setServices] = useState(DEFAULT_SERVICES)

  const toggleService = (id: string) =>
    setServices((s) => s.map((sv) => sv.id === id ? { ...sv, selected: !sv.selected } : sv))

  const handleFinish = async () => {
    // TODO: chamar API para criar tenant + profissional + serviços
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col">
      {/* Header */}
      <div className="bg-[#1A3A6B] text-white py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="font-sora font-extrabold text-lg">STYLO<span className="text-[#F5A623]">GESTOR</span></span>
          <span className="text-white/50 text-sm">Configuração inicial</span>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-[#E8E6E2] py-4 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    s.n < step ? 'bg-[#1B8A5A] text-white' : s.n === step ? 'bg-[#1A3A6B] text-white' : 'bg-[#E8E6E2] text-[#4A4A5A]'
                  }`}>
                    {s.n < step ? '✓' : s.n}
                  </div>
                  <span className={`text-xs hidden sm:block ${s.n === step ? 'font-semibold text-[#1A3A6B]' : 'text-[#4A4A5A]'}`}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${s.n < step ? 'bg-[#1B8A5A]' : 'bg-[#E8E6E2]'}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex items-start justify-center p-6 pt-8">
        <div className="w-full max-w-2xl space-y-6">

          {/* STEP 1 — Dados do negócio */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-[#E8E6E2] p-8 space-y-5">
              <div>
                <h2 className="font-sora font-bold text-2xl text-[#1C1C2E]">Vamos configurar seu negócio 🏪</h2>
                <p className="text-[#4A4A5A] text-sm mt-1">Essas informações aparecerão na sua página de agendamento online.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#4A4A5A] block mb-1">Tipo de negócio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: 'barbershop', l: '💈 Barbearia' },
                      { v: 'salon',      l: '✂️ Salão' },
                      { v: 'mixed',      l: '🔀 Barbearia + Salão' },
                    ].map((t) => (
                      <button key={t.v} onClick={() => setType(t.v)}
                        className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                          type === t.v ? 'border-[#1A3A6B] bg-[#1A3A6B]/5 text-[#1A3A6B]' : 'border-[#E8E6E2] text-[#4A4A5A] hover:border-[#1A3A6B]/30'
                        }`}>
                        {t.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#4A4A5A] block mb-1">Nome do negócio *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Barbearia do João"
                    className="w-full border border-[#E8E6E2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A5A] block mb-1">Telefone/WhatsApp *</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full border border-[#E8E6E2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A5A] block mb-1">Cidade</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full border border-[#E8E6E2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
                  </div>
                </div>
              </div>

              <button disabled={!name || !phone} onClick={() => setStep(2)}
                className="w-full bg-[#1A3A6B] disabled:opacity-40 text-white font-semibold py-3 rounded-xl hover:bg-[#142d55] transition-colors">
                Próximo →
              </button>
            </div>
          )}

          {/* STEP 2 — Horários */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-[#E8E6E2] p-8 space-y-5">
              <div>
                <h2 className="font-sora font-bold text-2xl text-[#1C1C2E]">Quando você atende? 🕐</h2>
                <p className="text-[#4A4A5A] text-sm mt-1">Configure os horários do seu negócio.</p>
              </div>

              <div className="space-y-2">
                {DIAS.map(({ key, label }) => {
                  const h = schedules.find((s) => s.day === key)!
                  return (
                    <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${h.active ? 'border-[#1A3A6B]/20' : 'border-[#E8E6E2] opacity-50'}`}>
                      <button onClick={() => setSchedules((s) => s.map((d) => d.day === key ? { ...d, active: !d.active } : d))}
                        className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${h.active ? 'bg-[#1A3A6B]' : 'bg-[#E8E6E2]'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.active ? 'left-4' : 'left-0.5'}`} />
                      </button>
                      <span className="text-sm font-medium w-16 text-[#1C1C2E]">{label}</span>
                      {h.active ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={h.start}
                            onChange={(e) => setSchedules((s) => s.map((d) => d.day === key ? { ...d, start: e.target.value } : d))}
                            className="border border-[#E8E6E2] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A6B]" />
                          <span className="text-[#4A4A5A] text-sm">–</span>
                          <input type="time" value={h.end}
                            onChange={(e) => setSchedules((s) => s.map((d) => d.day === key ? { ...d, end: e.target.value } : d))}
                            className="border border-[#E8E6E2] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A6B]" />
                        </div>
                      ) : (
                        <span className="text-sm text-[#4A4A5A]">Fechado</span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-[#E8E6E2] text-[#4A4A5A] py-3 rounded-xl font-medium">← Voltar</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-[#1A3A6B] text-white font-semibold py-3 rounded-xl hover:bg-[#142d55]">Próximo →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Profissional */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-[#E8E6E2] p-8 space-y-5">
              <div>
                <h2 className="font-sora font-bold text-2xl text-[#1C1C2E]">Cadastre seu primeiro profissional 👤</h2>
                <p className="text-[#4A4A5A] text-sm mt-1">Você pode adicionar mais depois.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#4A4A5A] block mb-1">Nome *</label>
                  <input value={profName} onChange={(e) => setProfName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full border border-[#E8E6E2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A5A] block mb-1">Função</label>
                    <select value={profRole} onChange={(e) => setProfRole(e.target.value)}
                      className="w-full border border-[#E8E6E2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
                      <option>Barbeiro</option>
                      <option>Cabeleireiro</option>
                      <option>Manicure</option>
                      <option>Maquiador</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4A4A5A] block mb-1">Comissão (%)</label>
                    <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)}
                      min="0" max="100" placeholder="40"
                      className="w-full border border-[#E8E6E2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-[#4A4A5A] cursor-pointer">
                  <input type="checkbox" className="accent-[#1A3A6B]"
                    onChange={(e) => e.target.checked && setProfName('Eu mesmo')} />
                  Sou eu mesmo (dono do negócio)
                </label>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border border-[#E8E6E2] text-[#4A4A5A] py-3 rounded-xl font-medium">← Voltar</button>
                <button disabled={!profName} onClick={() => setStep(4)} className="flex-1 bg-[#1A3A6B] disabled:opacity-40 text-white font-semibold py-3 rounded-xl hover:bg-[#142d55]">Próximo →</button>
              </div>
            </div>
          )}

          {/* STEP 4 — Serviços */}
          {step === 4 && (
            <div className="bg-white rounded-2xl border border-[#E8E6E2] p-8 space-y-5">
              <div>
                <h2 className="font-sora font-bold text-2xl text-[#1C1C2E]">Quais serviços você oferece? ✂️</h2>
                <p className="text-[#4A4A5A] text-sm mt-1">Selecione e ajuste os preços. Você pode editar depois.</p>
              </div>

              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${s.selected ? 'border-[#1A3A6B]/30 bg-[#1A3A6B]/3' : 'border-[#E8E6E2]'}`}>
                    <input type="checkbox" checked={s.selected} onChange={() => toggleService(s.id)}
                      className="accent-[#1A3A6B] w-4 h-4 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-[#1C1C2E]">{s.name}</span>
                    <span className="text-xs text-[#4A4A5A]">{s.duration}min</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#4A4A5A]">R$</span>
                      <input type="number" defaultValue={s.price} disabled={!s.selected}
                        className="w-16 border border-[#E8E6E2] rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#1A3A6B] disabled:opacity-40" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 border border-[#E8E6E2] text-[#4A4A5A] py-3 rounded-xl font-medium">← Voltar</button>
                <button onClick={handleFinish}
                  className="flex-1 bg-[#1B8A5A] text-white font-semibold py-3 rounded-xl hover:bg-[#156b47] transition-colors">
                  🎉 Concluir configuração
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
