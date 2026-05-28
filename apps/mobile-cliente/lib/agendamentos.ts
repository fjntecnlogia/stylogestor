// Agendamentos feitos pelo cliente.
// Persistidos local via expo-secure-store. Quando backend real existir,
// substituir as 3 funções (list/add/delete) por chamadas HTTP.

import { loadArray, saveArray, newId } from './storage'

export type StatusAgendamento = 'AGENDADO' | 'CONFIRMADO' | 'CONCLUIDO' | 'CANCELADO'

export type Agendamento = {
  id: string
  barbeariaSlug: string
  barbeariaNome: string
  servicosNomes: string         // joined: "Corte + Barba"
  profissionalNome: string
  dataISO: string                // ISO completa pra ordenação
  dataFmt: string                // ex: "quinta-feira, 28 de maio"
  hora: string                   // "14:00"
  duracao: number                // minutos
  preco: number
  status: StatusAgendamento
  observacao?: string
  createdAt: string              // ISO
}

const KEY = 'agendamentos_cliente_v1'

export async function listAgendamentos(): Promise<Agendamento[]> {
  const list = await loadArray<Agendamento>(KEY)
  // Mais recentes primeiro (data do agendamento desc)
  return list.sort((a, b) => b.dataISO.localeCompare(a.dataISO))
}

export async function addAgendamento(
  ag: Omit<Agendamento, 'id' | 'createdAt' | 'status'>,
): Promise<Agendamento> {
  const list = await loadArray<Agendamento>(KEY)
  const novo: Agendamento = {
    ...ag,
    id: newId('ag'),
    status: 'AGENDADO',
    createdAt: new Date().toISOString(),
  }
  await saveArray(KEY, [novo, ...list])
  return novo
}

export async function updateStatusAgendamento(
  id: string,
  status: StatusAgendamento,
): Promise<void> {
  const list = await loadArray<Agendamento>(KEY)
  await saveArray(KEY, list.map((a) => (a.id === id ? { ...a, status } : a)))
}

export async function deleteAgendamento(id: string): Promise<void> {
  const list = await loadArray<Agendamento>(KEY)
  await saveArray(KEY, list.filter((a) => a.id !== id))
}

// Filtra agendamentos futuros (depois de hoje)
export async function listFuturos(): Promise<Agendamento[]> {
  const list = await listAgendamentos()
  const agora = new Date().toISOString()
  return list.filter((a) => a.dataISO >= agora && a.status !== 'CANCELADO')
}

// Filtra agendamentos passados
export async function listPassados(): Promise<Agendamento[]> {
  const list = await listAgendamentos()
  const agora = new Date().toISOString()
  return list.filter((a) => a.dataISO < agora || a.status === 'CANCELADO' || a.status === 'CONCLUIDO')
}
