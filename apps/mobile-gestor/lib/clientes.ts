// CRUD local de clientes (cadastro do salao, nao usuarios do Clerk).
// Compartilhado entre tela /clientes (tab) e novo agendamento.

import { loadArray, saveArray } from './storage'

export type Cliente = {
  id: string
  name: string
  phone: string
  visits: number
  spent: number
  lastVisit: string
  tags: string[]
}

const KEY = 'clientes_v1'

const SEED: Cliente[] = [
  { id: '1', name: 'Carlos Oliveira', phone: '(11) 99999-0001', visits: 12, spent: 720,  lastVisit: '08/05', tags: ['vip'] },
  { id: '2', name: 'Rafael Santos',   phone: '(11) 99999-0002', visits: 5,  spent: 200,  lastVisit: '05/05', tags: [] },
  { id: '3', name: 'Pedro Alves',     phone: '(11) 99999-0003', visits: 23, spent: 1380, lastVisit: '09/05', tags: ['vip', 'mensal'] },
  { id: '4', name: 'Lucas Ferreira',  phone: '(11) 99999-0004', visits: 3,  spent: 120,  lastVisit: '01/05', tags: [] },
  { id: '5', name: 'André Lima',      phone: '(11) 99999-0005', visits: 8,  spent: 480,  lastVisit: '07/05', tags: ['mensal'] },
  { id: '6', name: 'Bruno Carvalho',  phone: '(11) 99999-0006', visits: 1,  spent: 40,   lastVisit: '02/05', tags: [] },
]

export async function listClientes(): Promise<Cliente[]> {
  let list = await loadArray<Cliente>(KEY)
  if (list.length === 0) {
    list = SEED
    await saveArray(KEY, list)
  }
  return list
}

export async function saveClientes(list: Cliente[]): Promise<void> {
  await saveArray(KEY, list)
}

export async function addCliente(c: Omit<Cliente, 'id' | 'visits' | 'spent' | 'lastVisit' | 'tags'>): Promise<Cliente> {
  const list = await listClientes()
  const novo: Cliente = {
    id: `cl_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    name: c.name,
    phone: c.phone,
    visits: 0,
    spent: 0,
    lastVisit: '',
    tags: [],
  }
  await saveArray(KEY, [novo, ...list])
  return novo
}
