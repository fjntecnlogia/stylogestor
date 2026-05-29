// Serviços do salão — servidos pela API NestJS (Fase 1, multi-tenant).
//
// Substitui o storage local. Consumido por servicos.tsx e novo-agendamento.tsx.
// Modelo do backend é soft-delete: `remove()` marca active:false e o item some
// da listagem (findAll só retorna active:true). Não há "reativar" via app.

import { servicesApi, type CreateServiceInput } from './api'

export type Servico = {
  id: string
  nome: string
  duracao: number
  preco: number
  categoria: string
  ativo: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromApi(s: any): Servico {
  return {
    id: String(s.id),
    nome: s.name ?? '',
    duracao: Number(s.duration ?? 0),
    preco: Number(s.price ?? 0),
    categoria: s.category ?? 'Outros',
    ativo: s.active !== false,
  }
}

export async function listServicos(): Promise<Servico[]> {
  const list = await servicesApi.list()
  return list.map(fromApi)
}

export async function addServico(sv: Omit<Servico, 'id' | 'ativo'>): Promise<Servico> {
  const input: CreateServiceInput = {
    name: sv.nome,
    price: sv.preco,
    duration: sv.duracao,
    category: sv.categoria,
  }
  return fromApi(await servicesApi.create(input))
}

export async function updateServico(
  id: string,
  sv: Omit<Servico, 'id' | 'ativo'>,
): Promise<Servico> {
  return fromApi(
    await servicesApi.update(id, {
      name: sv.nome,
      price: sv.preco,
      duration: sv.duracao,
      category: sv.categoria,
    }),
  )
}

export async function removeServico(id: string): Promise<void> {
  // Soft-delete no backend (active:false).
  await servicesApi.remove(id)
}
