// Lançamentos financeiros (entradas/saídas) — agora servidos pela API NestJS.
//
// Fase 1 da unificação (docs/MOBILE_FASE1_HANDOFF.md): o miolo migrou de
// SecureStore para `financialApi`. Assinaturas mantidas pra não mexer nas telas
// (financeiro.tsx, novo-lancamento.tsx, (tabs)/index.tsx).
//
// Adaptadores de formato local <-> API:
//   tipo:   'IN'/'OUT'  <->  'INCOME'/'EXPENSE'
//   método: 'PIX'/'Dinheiro'/'Cartão'/'Outro'  <->  'PIX'/'CASH'/'CREDIT_CARD'/...

import { financialApi, ApiError, type CreateTransactionInput, type PaymentMethod } from './api'

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

const metodoParaApi: Record<MetodoPagamento, PaymentMethod> = {
  PIX: 'PIX',
  Dinheiro: 'CASH',
  Cartão: 'CREDIT_CARD',
  Outro: 'OTHER',
}

const metodoDaApi: Record<string, MetodoPagamento> = {
  PIX: 'PIX',
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão',
  DEBIT_CARD: 'Cartão',
  TRANSFER: 'Outro',
  OTHER: 'Outro',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromApi(t: any): Lancamento {
  const d = new Date(t.date ?? t.createdAt ?? Date.now())
  return {
    id: String(t.id),
    type: t.type === 'INCOME' ? 'IN' : 'OUT',
    desc: t.description ?? '',
    method: metodoDaApi[t.paymentMethod] ?? 'Outro',
    amount: Number(t.amount ?? 0),
    date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    createdAt: t.createdAt ?? d.toISOString(),
  }
}

export async function listLancamentos(): Promise<Lancamento[]> {
  // Janela do mês corrente (a tela já filtra "hoje" por cima disso).
  const hoje = new Date()
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59).toISOString()
  const txs = await financialApi.transactions(ini, fim)
  return txs.map(fromApi)
}

export async function addLancamento(
  l: Omit<Lancamento, 'id' | 'createdAt'>,
): Promise<Lancamento> {
  const input: CreateTransactionInput = {
    type: l.type === 'IN' ? 'INCOME' : 'EXPENSE',
    category: 'geral',
    description: l.desc,
    amount: l.amount,
    date: new Date().toISOString(),
    paymentMethod: metodoParaApi[l.method],
  }
  return fromApi(await financialApi.createTransaction(input))
}

export async function deleteLancamento(_id: string): Promise<void> {
  // A API ainda não expõe DELETE /financial/transactions/:id (ver handoff §6).
  // Lançamos um ApiError tratado na tela (financeiro.tsx) pra dar feedback
  // honesto em vez de fingir que excluiu.
  throw new ApiError(501, 'Exclusão de lançamentos ainda não está disponível no app.')
}

// Soma entradas/saídas filtrando por data (dd/MM). Se data omitida, soma tudo.
export function calcResumo(lista: Lancamento[], date?: string) {
  const filtered = date ? lista.filter((l) => l.date === date) : lista
  const entradas = filtered.filter((l) => l.type === 'IN').reduce((s, l) => s + l.amount, 0)
  const saidas = filtered.filter((l) => l.type === 'OUT').reduce((s, l) => s + l.amount, 0)
  return { entradas, saidas, saldo: entradas - saidas, itens: filtered }
}
