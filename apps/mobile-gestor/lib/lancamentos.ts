// CRUD local de lançamentos financeiros (entradas/saídas).
// Usado em (tabs)/financeiro.tsx e novo-lancamento.tsx.
//
// Lançamentos "auto" (vindo de agendamento concluído) podem ser inseridos via
// addLancamentoFromAgendamento — útil pra futuro quando concluir agendamento
// gerar entrada automatica.

import { loadArray, saveArray, newId } from './storage'

export type MetodoPagamento = 'PIX' | 'Dinheiro' | 'Cartão' | 'Outro'

export type Lancamento = {
  id: string
  type: 'IN' | 'OUT'         // entrada ou saída
  desc: string                // descrição
  method: MetodoPagamento
  amount: number              // em reais (number, não centavos)
  date: string                // dd/MM
  time: string                // HH:mm
  agendamentoId?: string      // se veio de agendamento concluído
  createdAt: string           // ISO
}

const KEY = 'lancamentos_v1'

export async function listLancamentos(): Promise<Lancamento[]> {
  return loadArray<Lancamento>(KEY)
}

export async function addLancamento(
  l: Omit<Lancamento, 'id' | 'createdAt'>,
): Promise<Lancamento> {
  const list = await listLancamentos()
  const novo: Lancamento = {
    ...l,
    id: newId('lc'),
    createdAt: new Date().toISOString(),
  }
  await saveArray(KEY, [novo, ...list])
  return novo
}

export async function deleteLancamento(id: string): Promise<void> {
  const list = await listLancamentos()
  await saveArray(KEY, list.filter((l) => l.id !== id))
}

// Soma entradas/saídas filtrando por data (dd/MM). Se data omitida, soma tudo.
export function calcResumo(lista: Lancamento[], date?: string) {
  const filtered = date ? lista.filter((l) => l.date === date) : lista
  const entradas = filtered.filter((l) => l.type === 'IN').reduce((s, l) => s + l.amount, 0)
  const saidas = filtered.filter((l) => l.type === 'OUT').reduce((s, l) => s + l.amount, 0)
  return { entradas, saidas, saldo: entradas - saidas, itens: filtered }
}
