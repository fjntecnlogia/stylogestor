// Profissionais do salão — servidos pela API NestJS (Fase 1, multi-tenant).
//
// Substitui o storage local. Consumido por profissionais.tsx e novo-agendamento.tsx.
// Não há rota DELETE no backend (handoff §6): exclusão é soft via PATCH active:false.
// A listagem (findAll) só retorna active:true, então removidos somem.

import { professionalsApi } from './api'

export type Profissional = {
  id: string
  nome: string
  role: string
  telefone: string
  comissaoPct: number
  ativo: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromApi(p: any): Profissional {
  return {
    id: String(p.id),
    nome: p.name ?? '',
    role: p.role ?? 'Barbeiro',
    telefone: p.phone ?? '',
    comissaoPct: Number(p.commission ?? 0),
    ativo: p.active !== false,
  }
}

export async function listProfissionais(): Promise<Profissional[]> {
  const list = await professionalsApi.list()
  return list.map(fromApi)
}

export async function addProfissional(
  p: Omit<Profissional, 'id' | 'ativo'>,
): Promise<Profissional> {
  return fromApi(
    await professionalsApi.create({
      name: p.nome,
      role: p.role,
      ...(p.telefone ? { phone: p.telefone } : {}),
      commission: p.comissaoPct,
      commissionType: 'percentage',
    }),
  )
}

export async function updateProfissional(
  id: string,
  p: Omit<Profissional, 'id' | 'ativo'>,
): Promise<Profissional> {
  return fromApi(
    await professionalsApi.update(id, {
      name: p.nome,
      role: p.role,
      ...(p.telefone ? { phone: p.telefone } : {}),
      commission: p.comissaoPct,
    }),
  )
}

export async function removeProfissional(id: string): Promise<void> {
  // Sem rota DELETE — soft-delete via PATCH active:false.
  await professionalsApi.update(id, { active: false })
}
