// Clientes do salão — agora servidos pela API NestJS (multi-tenant).
//
// Fase 1 da unificação (docs/MOBILE_FASE1_HANDOFF.md): o miolo migrou de
// SecureStore para `clientsApi`. As ASSINATURAS abaixo são mantidas iguais
// pra não mexer nas telas (clientes.tsx, fidelidade.tsx, novo-agendamento.tsx).

import { clientsApi, type CreateClientInput } from './api'

export type Cliente = {
  id: string
  name: string
  phone: string
  visits: number
  spent: number
  lastVisit: string
  tags: string[]
}

// Mapeia o objeto cru da API → shape que as telas já consomem.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromApi(c: any): Cliente {
  return {
    id: String(c.id),
    name: c.name ?? '',
    phone: c.phone ?? '',
    visits: c.totalVisits ?? 0,
    spent: Number(c.totalSpent ?? 0),
    lastVisit: c.lastVisit
      ? new Date(c.lastVisit).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      : '',
    tags: Array.isArray(c.tags) ? c.tags : [],
  }
}

export async function listClientes(): Promise<Cliente[]> {
  const list = await clientsApi.list()
  return list.map(fromApi)
}

export async function addCliente(
  c: Omit<Cliente, 'id' | 'visits' | 'spent' | 'lastVisit' | 'tags'>,
): Promise<Cliente> {
  const input: CreateClientInput = { name: c.name, phone: c.phone }
  return fromApi(await clientsApi.create(input))
}
