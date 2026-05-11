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

// Classes reutilizáveis
const inputCls = 'w-full border border-[#D1D5DB] rounded-xl px-4 py-3 text-sm text-[#111827] font-medium placeholder:text-[#9CA3AF] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] focus:border-transparent bg-white'
const labelCls = 'text-sm font-semibold text-[#111827] block mb-1.5'

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
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Header */}
      <div className="bg-[#1A3A6B] text-white py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="font-sora font-extrabold text-lg">
            STYLO<span className="text-[#F5A623]">GESTOR</span>
          </span>
          <span className="text-white/60 text-sm font-medium">Configuração inicial</span>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-[#E5E7EB] py-4 px-6 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                    s.n < step
                      ? 'bg-[#1B8A5A] text-white'
                      : s.n === step
                      ? 'bg-[#1A3A6B] text-white shadow-md'
                      : 'bg-[#E5E7EB] text-[#6B7280]'
                  }`}>
                    {s.n < step ? '✓' : s.n}
                  </div>
                  <span className={`text-sm hidden sm:block font-semibold ${
                    s.n === step ? 'text-[#1A3A6B]' : s.n < step ? 'text-[#1B8A5A]' : 'text-[#9CA3AF]'
                  }`}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-3 rounded-full transition-all ${
                      s.n < step ? 'bg-[#1B8A5A]' : 'bg-[#E5E7EB]'
                    }`} />
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
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="font-sora font-bold text-2xl text-[#111827]">
                  Vamos configurar seu negócio 🏪
                </h2>
                <p className="text-[#6B7280] text-sm mt-1.5 font-medium">
                  Essas informações aparecerão na sua página de agendamento online.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Tipo de negócio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: 'barbershop', l: '💈 Barbearia' },
                      { v: 'salon',      l: '✂️ Salão' },
                      { v: 'mixed',      l: '🔀 Barbearia + Salão' },
                    ].map((t) => (
                      <button key={t.v} onClick={() => setType(t.v)}
                        className={`py-3 px-2 rounded-xl border text-sm font-semibold transition-all ${
                          type === t.v
                            ? 'border-[#1A3A6B] bg-[#1A3A6B]/5 text-[#1A3A6B]'
                            : 'border-[#D1D5DB] text-[#374151] hover:border-[#1A3A6B]/50 hover:bg-[#F9FAFB]'
                        }`}>
                        {t.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Nome do negócio *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Barbearia do João"
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Telefone/WhatsApp *</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Cidade</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              <button
                disabled={!name || !phone}
                onClick={() => setStep(2)}
                className="w-full bg-[#1A3A6B] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl hover:bg-[#142d55] transition-colors text-base shadow-sm">
                Próximo →
              </button>
            </div>
          )}

          {/* STEP 2 — Horários */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="font-sora font-bold text-2xl text-[#111827]">Quando você atende? 🕐</h2>
                <p className="text-[#6B7280] text-sm mt-1.5 font-medium">Configure os horários do seu negócio.</p>
              </div>

              <div className="space-y-2">
                {DIAS.map(({ key, label }) => {
                  const h = schedules.find((s) => s.day === key)!
                  return (
                    <div key={key} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                      h.active ? 'border-[#1A3A6B]/20 bg-[#F8FAFF]' : 'border-[#E5E7EB] bg-[#F9FAFB]'
                    }`}>
                      <button
                        onClick={() => setSchedules((s) => s.map((d) => d.day === key ? { ...d, active: !d.active } : d))}
                        className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${h.active ? 'bg-[#1A3A6B]' : 'bg-[#D1D5DB]'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.active ? 'left-5' : 'left-0.5'}`} />
                      </button>
                      <span className={`text-sm w-16 font-semibold ${h.active ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>
                        {label}
                      </span>
                      {h.active ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={h.start}
                            onChange={(e) => setSchedules((s) => s.map((d) => d.day === key ? { ...d, start: e.target.value } : d))}
                            className="border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-sm text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] bg-white" />
                          <span className="text-[#6B7280] text-sm font-medium">até</span>
                          <input type="time" value={h.end}
                            onChange={(e) => setSchedules((s) => s.map((d) => d.day === key ? { ...d, end: e.target.value } : d))}
                            className="border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-sm text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] bg-white" />
                        </div>
                      ) : (
                        <span className="text-sm text-[#9CA3AF] font-medium">Fechado</span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 border-2 border-[#E5E7EB] text-[#374151] font-semibold py-3 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                  ← Voltar
                </button>
                <button onClick={() => setStep(3)}
                  className="flex-1 bg-[#1A3A6B] text-white font-bold py-3 rounded-xl hover:bg-[#142d55] transition-colors shadow-sm">
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Profissional */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="font-sora font-bold text-2xl text-[#111827]">Cadastre seu primeiro profissional 👤</h2>
                <p className="text-[#6B7280] text-sm mt-1.5 font-medium">Você pode adicionar mais depois.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Nome *</label>
                  <input
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Função</label>
                    <select
                      value={profRole}
                      onChange={(e) => setProfRole(e.target.value)}
                      className={inputCls}>
                      <option>Barbeiro</option>
                      <option>Cabeleireiro</option>
                      <option>Manicure</option>
                      <option>Maquiador</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Comissão (%)</label>
                    <input
                      type="number"
                      value={commission}
                      onChange={(e) => setCommission(e.target.value)}
                      min="0" max="100"
                      placeholder="40"
                      className={inputCls}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[#1A3A6B]"
                    onChange={(e) => e.target.checked && setProfName('Eu mesmo')}
                  />
                  <span className="text-sm font-semibold text-[#374151] group-hover:text-[#1A3A6B] transition-colors">
                    Sou eu mesmo (dono do negócio)
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 border-2 border-[#E5E7EB] text-[#374151] font-semibold py-3 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                  ← Voltar
                </button>
                <button
                  disabled={!profName}
                  onClick={() => setStep(4)}
                  className="flex-1 bg-[#1A3A6B] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl hover:bg-[#142d55] transition-colors shadow-sm">
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — Serviços */}
          {step === 4 && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="font-sora font-bold text-2xl text-[#111827]">Quais serviços você oferece? ✂️</h2>
                <p className="text-[#6B7280] text-sm mt-1.5 font-medium">Selecione e ajuste os preços. Você pode editar depois.</p>
              </div>

              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                      s.selected
                        ? 'border-[#1A3A6B]/30 bg-[#F0F4FF]'
                        : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]'
                    }`}
                    onClick={() => toggleService(s.id)}>
                    <input
                      type="checkbox"
                      checked={s.selected}
                      onChange={() => toggleService(s.id)}
                      className="w-4 h-4 accent-[#1A3A6B] shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="flex-1 text-sm font-semibold text-[#111827]">{s.name}</span>
                    <span className="text-xs text-[#6B7280] font-medium">{s.duration} min</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#374151]">R$</span>
                      <input
                        type="number"
                        defaultValue={s.price}
                        disabled={!s.selected}
                        className="w-16 border border-[#D1D5DB] rounded-lg px-2 py-1 text-sm text-[#111827] font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] disabled:opacity-40 bg-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)}
                  className="flex-1 border-2 border-[#E5E7EB] text-[#374151] font-semibold py-3 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                  ← Voltar
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 bg-[#1B8A5A] text-white font-bold py-3 rounded-xl hover:bg-[#156b47] transition-colors shadow-sm text-base">
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
