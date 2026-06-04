'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/components/ui/toast'
import { NovoClienteModal } from '../clientes/novo-cliente-modal'
// Reusa as mesmas fixtures das views irmãs. Quando a API real estiver
// plugada, basta trocar essas chamadas por fetches específicos (ex:
// listar só clientes ativos via /api/clients?active=1).
import { getInitialClients, type ClientFixture } from '../clientes/__fixtures__/clients'
import { getInitialServices, type ServiceFixture } from '../servicos/__fixtures__/services'
import { getInitialProfessionals } from '../profissionais/__fixtures__/professionals'

export interface NewAppointmentPayload {
  clientId: string
  clientName: string
  clientPhone: string
  serviceIds: string[]
  serviceLabel: string
  professionalId: string
  professionalName: string
  date: string
  time: string
  price: number
  duration: number
}

interface Props {
  open: boolean
  onClose: () => void
  defaultDate?: string
  defaultTime?: string
  defaultProfessionalId?: string
  /**
   * Chamado ao confirmar. Pode retornar `{ ok: false, error: '...' }` que
   * o modal vai mostrar como banner vermelho persistente. Se retornar
   * `{ ok: true }` ou undefined (legacy), o modal fecha sozinho.
   */
  onSave?: (appt: NewAppointmentPayload) => Promise<{ ok: boolean; error?: string } | void> | void
}

export function AppointmentModal({ open, onClose, defaultDate, defaultTime, defaultProfessionalId, onSave }: Props) {
  // Estes useState pegam os defaults só no mount. O pai deve usar
  // `key` que muda quando o slot clicado muda (ou montar condicionalmente
  // com `open && <AppointmentModal />`) para que esses defaults sejam respeitados.
  // Data padrão = HOJE em LOCAL (não UTC!). À noite no Brasil,
  // toISOString().slice(0,10) retorna AMANHÃ (data UTC) — o gestor abria
  // o modal pensando hoje e o agendamento sumia (criado pro dia seguinte).
  const localToday = (() => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  })()
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientFixture | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [professional, setProfessional] = useState(defaultProfessionalId || '')
  const [date, setDate] = useState(defaultDate || localToday)
  const [time, setTime] = useState(defaultTime || '09:00')
  // Erro persistente do submit (ex: 409 conflito). Mantém modal aberto pro
  // gestor ver a mensagem e ajustar o horário em vez de re-abrir tudo.
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'client' | 'services' | 'schedule'>('client')

  // Sources das listas. Hidrata do banco via API ao montar — fonte de
  // verdade. Fallback pros mocks caso a API falhe (não bloqueia o uso).
  const [allClients, setAllClients] = useState<ClientFixture[]>(() => getInitialClients())
  const [allServices, setAllServices] = useState<ServiceFixture[]>(() => getInitialServices().filter((s) => s.active))
  const [allProfessionals, setAllProfessionals] = useState(() => getInitialProfessionals().filter((p) => p.active))
  const [novoClienteOpen, setNovoClienteOpen] = useState(false)
  const { success, error } = useToast()

  // Schedule da barbearia pra mostrar warning de horário fora do funcionamento
  const [businessHours, setBusinessHours] = useState<Array<{ day: number; start: string; end: string; active: boolean }>>([])

  // Hidrata as listas quando o modal abre — pega criados/editados em tempo real
  useEffect(() => {
    if (!open) return
    let cancelled = false
    Promise.all([
      fetch('/api/clients').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/services').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/professionals').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/me/business-schedule').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([clients, services, professionals, schedule]) => {
        if (cancelled) return
        if (Array.isArray(clients) && clients.length > 0) setAllClients(clients)
        if (Array.isArray(services) && services.length > 0) setAllServices(services.filter((s: ServiceFixture) => s.active))
        if (Array.isArray(professionals) && professionals.length > 0) setAllProfessionals(professionals.filter((p: { active: boolean }) => p.active))
        if (Array.isArray(schedule)) setBusinessHours(schedule)
      })
      .catch(() => { /* silencioso — segue com cache */ })
    return () => { cancelled = true }
  }, [open])

  // Cadastra cliente novo via API (chamado pelo NovoClienteModal embutido)
  const handleNovoCliente = async (data: { name: string; phone: string; email: string; notes: string }) => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, phone: data.phone, email: data.email }),
      })
      const novo = await res.json()
      if (!res.ok) {
        error(novo.error || 'Erro ao cadastrar cliente')
        return
      }
      // Adiciona à lista + já seleciona pro próximo passo
      setAllClients((prev) => [novo, ...prev])
      setSelectedClient(novo)
      setClientSearch('')
      success(`Cliente ${novo.name} cadastrado! 👤`)
    } catch (err) {
      error('Erro de conexão')
      console.error(err)
    }
  }

  // Validação de data/hora — bloqueia agendamento no passado.
  // Comparação feita em LOCAL do browser (mesmo fuso onde o user digita).
  // Evita bug de UTC: antes new Date(`${date}T${time}:00`) era interpretado
  // como UTC em algumas situações; agora comparamos timestamps diretos.
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const minTimeForToday = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  const isPastDate = date < todayStr
  const isPastTime = date === todayStr && time < minTimeForToday
  const isInPast = isPastDate || isPastTime

  // Validação contra horário de funcionamento da barbearia.
  // Pega o dia da semana da data escolhida (0=Dom, 6=Sáb) e compara HH:mm
  // com o BusinessSchedule daquele dia. Se barbearia fechada ou fora do
  // horário, mostra warning + bloqueia confirmar.
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const selectedDayOfWeek = date ? new Date(`${date}T12:00:00`).getDay() : -1
  const todaySchedule = businessHours.find((s) => s.day === selectedDayOfWeek)
  const isClosedDay = todaySchedule && !todaySchedule.active
  const isOutsideHours = todaySchedule && todaySchedule.active && time && (
    time < todaySchedule.start || time >= todaySchedule.end
  )
  const scheduleWarning = isClosedDay
    ? `A barbearia não funciona na ${dayNames[selectedDayOfWeek]}-feira.`
    : isOutsideHours
    ? `Fora do horário: na ${dayNames[selectedDayOfWeek]}-feira a barbearia atende das ${todaySchedule!.start} às ${todaySchedule!.end}.`
    : ''

  const filteredClients = allClients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
  )

  const selectedServiceObjs: ServiceFixture[] = allServices.filter((s) => selectedServices.includes(s.id))
  const totalPrice = selectedServiceObjs.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = selectedServiceObjs.reduce((sum, s) => sum + s.duration, 0)

  const handleClose = () => {
    setStep('client')
    setSelectedClient(null)
    setSelectedServices([])
    setClientSearch('')
    setSubmitError(null)
    setSubmitting(false)
    onClose()
  }

  // Limpa erro quando user muda data/hora/profissional — sinal de que tá
  // tentando outro horário pra resolver o conflito.
  useEffect(() => {
    if (submitError) setSubmitError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, time, professional])

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-0 overflow-hidden">

          {/* Header */}
          <div className="bg-[#1A3A6B] px-6 py-4">
            <Dialog.Title className="text-white font-sora font-bold text-lg">
              ✂️ Novo Agendamento
            </Dialog.Title>
            <p className="text-white/60 text-sm mt-0.5">
              {step === 'client' && 'Passo 1 de 3 — Selecionar cliente'}
              {step === 'services' && 'Passo 2 de 3 — Selecionar serviços'}
              {step === 'schedule' && 'Passo 3 de 3 — Data, hora e profissional'}
            </p>
          </div>

          {/* Conteúdo por step */}
          <div className="p-6 min-h-[300px]">

            {/* STEP 1 — Cliente */}
            {step === 'client' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Buscar por nome ou telefone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full border border-[#E8E6E2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
                />
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClient(c)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        selectedClient?.id === c.id
                          ? 'border-[#1A3A6B] bg-[#1A3A6B]/5'
                          : 'border-[#E8E6E2] hover:border-[#1A3A6B]/30'
                      }`}
                    >
                      <p className="text-sm font-medium text-[#1C1C2E]">{c.name}</p>
                      <p className="text-xs text-[#4A4A5A]">{c.phone}</p>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setNovoClienteOpen(true)}
                  className="text-sm text-[#1A3A6B] font-medium hover:underline"
                >
                  + Cadastrar novo cliente
                </button>
              </div>
            )}

            {/* STEP 2 — Serviços */}
            {step === 'services' && (
              <div className="space-y-2">
                {/* Empty state: tenant sem serviços ativos cadastrados.
                    Sem isso, a area ficava em branco e parecia bug. */}
                {allServices.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-[#F8F6F2] rounded-xl border border-dashed border-[#E8E6E2]">
                    <p className="text-3xl mb-2">✂️</p>
                    <p className="text-sm font-semibold text-[#1C1C2E] mb-1">
                      Nenhum serviço cadastrado
                    </p>
                    <p className="text-xs text-[#4A4A5A] mb-4">
                      Você precisa de pelo menos 1 serviço pra criar um agendamento.
                    </p>
                    <a
                      href="/servicos"
                      className="inline-block bg-[#1A3A6B] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#142d55] transition-colors"
                    >
                      Cadastrar serviço →
                    </a>
                  </div>
                ) : (
                  <>
                {allServices.map((s) => {
                  const selected = selectedServices.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        setSelectedServices((prev) =>
                          selected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                        )
                      }
                      className={`w-full text-left px-4 py-3 rounded-xl border flex justify-between items-center transition-all ${
                        selected ? 'border-[#1A3A6B] bg-[#1A3A6B]/5' : 'border-[#E8E6E2] hover:border-[#1A3A6B]/30'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-[#1C1C2E]">{s.name}</p>
                        <p className="text-xs text-[#4A4A5A]">{s.duration} min</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#1A3A6B]">R$ {s.price}</p>
                        {selected && <span className="text-xs text-[#1B8A5A]">✓ selecionado</span>}
                      </div>
                    </button>
                  )
                })}
                {selectedServices.length > 0 && (
                  <div className="pt-3 border-t border-[#E8E6E2] flex justify-between text-sm">
                    <span className="text-[#4A4A5A]">Total: {totalDuration} min</span>
                    <span className="font-bold text-[#1A3A6B]">R$ {totalPrice}</span>
                  </div>
                )}
                  </>
                )}
              </div>
            )}

            {/* STEP 3 — Data/Hora/Profissional */}
            {step === 'schedule' && (
              <div className="space-y-4">
                <div className="bg-[#F8F6F2] rounded-xl p-4 text-sm">
                  <p className="text-[#4A4A5A]">Cliente: <span className="font-medium text-[#1C1C2E]">{selectedClient?.name}</span></p>
                  <p className="text-[#4A4A5A]">Serviços: <span className="font-medium text-[#1C1C2E]">{selectedServices.length} selecionado(s) · R$ {totalPrice}</span></p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#4A4A5A] block mb-1">Data</label>
                    <input
                      type="date"
                      value={date}
                      min={todayStr}
                      onChange={(e) => setDate(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                        isPastDate ? 'border-red-300 focus:ring-red-500' : 'border-[#E8E6E2] focus:ring-[#1A3A6B]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#4A4A5A] block mb-1">Horário</label>
                    <input
                      type="time"
                      value={time}
                      min={date === todayStr ? minTimeForToday : undefined}
                      onChange={(e) => setTime(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                        isPastTime ? 'border-red-300 focus:ring-red-500' : 'border-[#E8E6E2] focus:ring-[#1A3A6B]'
                      }`}
                    />
                  </div>
                </div>

                {/* Aviso se data/hora no passado */}
                {isInPast && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                    ⚠️ Esse horário já passou. Escolha uma data ou hora futura.
                  </div>
                )}

                {/* Aviso de horário fora do funcionamento da barbearia */}
                {!isInPast && scheduleWarning && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
                    ⚠️ {scheduleWarning} <span className="font-semibold">Configure em /configurações → Horários se quiser ajustar.</span>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-[#4A4A5A] block mb-1">Profissional</label>
                  <select
                    value={professional}
                    onChange={(e) => setProfessional(e.target.value)}
                    className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
                  >
                    <option value="">Selecionar profissional</option>
                    {allProfessionals.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Banner de erro persistente (conflito, fora do horário, etc) */}
          {submitError && (
            <div className="px-6 pb-3">
              <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-red-800 mb-0.5">⚠️ Não foi possível agendar</p>
                <p className="text-sm text-red-700 leading-snug">{submitError}</p>
                <p className="text-[10px] text-red-500 mt-1">
                  Ajuste a data, horário ou profissional pra tentar de novo.
                </p>
              </div>
            </div>
          )}

          {/* Footer com botões */}
          <div className="px-6 py-4 border-t border-[#E8E6E2] flex justify-between">
            <button
              onClick={step === 'client' ? handleClose : () => setStep(step === 'services' ? 'client' : 'services')}
              className="text-sm text-[#4A4A5A] font-medium hover:text-[#1C1C2E]"
            >
              {step === 'client' ? 'Cancelar' : '← Voltar'}
            </button>

            {step !== 'schedule' ? (
              <button
                onClick={() => setStep(step === 'client' ? 'services' : 'schedule')}
                disabled={step === 'client' ? !selectedClient : selectedServices.length === 0}
                className="bg-[#1A3A6B] disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#142d55] transition-colors"
              >
                Próximo →
              </button>
            ) : (
              <button
                disabled={submitting || !professional || !selectedClient || selectedServices.length === 0 || isInPast || !!scheduleWarning}
                onClick={async () => {
                  if (!selectedClient || selectedServices.length === 0 || !professional) return
                  if (isInPast) {
                    setSubmitError('Não é possível agendar no passado.')
                    return
                  }
                  if (scheduleWarning) {
                    setSubmitError(scheduleWarning)
                    return
                  }
                  const services = selectedServiceObjs
                  const prof = allProfessionals.find((p) => p.id === professional)
                  setSubmitError(null)
                  setSubmitting(true)
                  try {
                    const result = await onSave?.({
                      clientId: selectedClient.id,
                      clientName: selectedClient.name,
                      clientPhone: selectedClient.phone,
                      serviceIds: selectedServices,
                      serviceLabel: services.map((s) => s.name).join(' + '),
                      professionalId: professional,
                      professionalName: prof?.name ?? '',
                      date,
                      time,
                      price: totalPrice,
                      duration: totalDuration,
                    })
                    // Se onSave retornar { ok: false }, mostra banner em vez de fechar.
                    // Se retornar undefined (legacy) ou { ok: true }, fecha modal.
                    if (result && result.ok === false) {
                      setSubmitError(result.error ?? 'Erro ao agendar')
                      setSubmitting(false)
                      return
                    }
                    handleClose()
                  } catch (err) {
                    setSubmitError('Erro de conexão. Tente novamente.')
                    setSubmitting(false)
                    console.error(err)
                  }
                }}
                className="bg-[#1B8A5A] disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#156b47] transition-colors"
              >
                {submitting ? 'Agendando...' : '✓ Confirmar agendamento'}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Sub-modal de cadastro rápido de cliente — abre por cima do AppointmentModal */}
      <NovoClienteModal
        open={novoClienteOpen}
        onClose={() => setNovoClienteOpen(false)}
        onSave={handleNovoCliente}
      />
    </Dialog.Root>
  )
}
