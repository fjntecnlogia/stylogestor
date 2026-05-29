// CRUD de agendamentos (appointments) via API NestJS.
//
// Fase 1 (fechamento): migrado de storage local → API. Antes os
// agendamentos ficavam só no SecureStore do aparelho e NÃO apareciam
// no web (que lê do banco). Agora grava/lê do banco via appointmentsApi,
// unificando web ↔ mobile (mesma tabela, mesmo tenant).
//
// A interface `Agendamento` é mantida (date "dd/MM" + time "HH:mm" etc)
// pra as telas (agenda.tsx, novo-agendamento.tsx) mudarem o mínimo —
// os adaptadores fromApi/addAgendamento convertem entre o shape da API
// (startTime/endTime ISO, services aninhados) e o shape local.

import { format } from 'date-fns'
import { appointmentsApi, type AppointmentStatus } from './api'

export type Agendamento = {
  id: string
  date: string          // dd/MM (deriva de startTime; usado pelo carrossel da agenda)
  time: string          // HH:mm
  clienteId: string
  clienteNome: string
  servicoIds: string[]
  servicoNomes: string  // joined ex: "Corte + Barba"
  profissionalId: string
  profissionalNome: string
  status: AppointmentStatus
  price: number
  duration: number      // minutos
  observacao?: string
  createdAt: string     // ISO
  startISO?: string     // ISO original do startTime (referência)
}

// ── Adaptador API → Agendamento ──────────────────────────────────────
// O fuso é o do device (gestor no Brasil = BRT), igual o web faz ao
// formatar. startTime é a fonte de verdade pra date+time.
function fromApi(a: Record<string, any>): Agendamento {
  const o = a
  const start = new Date(o.startTime)
  const services: any[] = Array.isArray(o.services) ? o.services : []
  return {
    id: String(o.id),
    date: format(start, 'dd/MM'),
    time: format(start, 'HH:mm'),
    clienteId: o.client?.id ?? o.clientId ?? '',
    clienteNome: o.client?.name ?? '',
    servicoIds: services.map((s) => s.serviceId ?? s.service?.id).filter(Boolean),
    servicoNomes: services.map((s) => s.service?.name).filter(Boolean).join(' + '),
    profissionalId: o.professional?.id ?? o.professionalId ?? '',
    profissionalNome: o.professional?.name ?? '',
    status: (o.status as AppointmentStatus) ?? 'SCHEDULED',
    price: Number(o.totalPrice ?? 0),
    duration: Number(o.totalDuration ?? 0),
    observacao: o.notes ?? undefined,
    createdAt: o.createdAt ?? new Date().toISOString(),
    startISO: o.startTime,
  }
}

/** Lista todos os agendamentos do tenant (a tela filtra por dia localmente). */
export async function listAgendamentos(): Promise<Agendamento[]> {
  const data = await appointmentsApi.list()
  return (Array.isArray(data) ? data : []).map(fromApi)
}

// ── Criação ──────────────────────────────────────────────────────────
// Recebe o Date completo do dia (tem o ano) + horário "HH:mm". Monta o
// startTime/endTime em ISO (fuso local → UTC no toISOString), igual o web.
export type AddAgendamentoInput = {
  dateObj: Date
  time: string          // HH:mm
  clienteId: string
  servicoIds: string[]
  profissionalId: string
  price: number
  duration: number      // minutos
  observacao?: string
}

export async function addAgendamento(input: AddAgendamentoInput): Promise<Agendamento> {
  const [h, m] = input.time.split(':').map(Number)
  const start = new Date(input.dateObj)
  start.setHours(h ?? 0, m ?? 0, 0, 0)
  const end = new Date(start.getTime() + (input.duration || 0) * 60_000)

  const created = await appointmentsApi.create({
    clientId: input.clienteId,
    professionalId: input.profissionalId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    serviceIds: input.servicoIds,
    totalPrice: input.price,
    totalDuration: input.duration,
    notes: input.observacao,
    source: 'mobile-gestor',
  })
  return fromApi(created)
}

export async function updateAgendamentoStatus(id: string, status: AppointmentStatus): Promise<void> {
  await appointmentsApi.setStatus(id, status)
}

export async function deleteAgendamento(id: string): Promise<void> {
  await appointmentsApi.remove(id)
}
