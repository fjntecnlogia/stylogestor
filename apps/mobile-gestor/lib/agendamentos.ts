// CRUD local de agendamentos (appointments).
// Usado por agenda.tsx (lista) e novo-agendamento.tsx (criacao).

import { loadArray, saveArray, newId } from './storage'

export type Agendamento = {
  id: string
  date: string          // dd/MM (para casar com carrossel do agenda.tsx)
  time: string          // HH:mm
  clienteId: string
  clienteNome: string
  servicoIds: string[]
  servicoNomes: string  // joined string ex: "Corte + Barba"
  profissionalId: string
  profissionalNome: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'CONFIRMED'
  price: number
  duration: number      // minutos
  observacao?: string
  createdAt: string     // ISO
}

const KEY = 'agendamentos_gestor_v1'

export async function listAgendamentos(): Promise<Agendamento[]> {
  return loadArray<Agendamento>(KEY)
}

export async function saveAgendamentos(list: Agendamento[]): Promise<void> {
  await saveArray(KEY, list)
}

export async function addAgendamento(a: Omit<Agendamento, 'id' | 'createdAt' | 'status'>): Promise<Agendamento> {
  const list = await listAgendamentos()
  const novo: Agendamento = {
    ...a,
    id: newId('ag'),
    createdAt: new Date().toISOString(),
    status: 'SCHEDULED',
  }
  await saveArray(KEY, [novo, ...list])
  return novo
}

export async function updateAgendamentoStatus(id: string, status: Agendamento['status']): Promise<void> {
  const list = await listAgendamentos()
  await saveArray(KEY, list.map((a) => (a.id === id ? { ...a, status } : a)))
}

export async function deleteAgendamento(id: string): Promise<void> {
  const list = await listAgendamentos()
  await saveArray(KEY, list.filter((a) => a.id !== id))
}
