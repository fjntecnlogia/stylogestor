/**
 * Fixtures financeiros — fallback do `/api/reports/financeiro` enquanto a
 * conta do gestor ainda não tem dados reais. Gated por `NEXT_PUBLIC_USE_MOCKS`.
 */

export interface TransactionFixture {
  id: string
  type: 'INCOME' | 'EXPENSE'
  desc: string
  cat: string
  method: string
  amount: number
  time: string
  date: string
}

export interface WeekDataFixture {
  day: string
  income: number
  expense: number
}

export interface PaymentMethodFixture {
  method: string
  total: number
  pct: number
  color: string
}

export const MOCK_WEEK_DATA: WeekDataFixture[] = [
  { day: 'Seg', income: 320, expense: 0 },
  { day: 'Ter', income: 450, expense: 85 },
  { day: 'Qua', income: 280, expense: 0 },
  { day: 'Qui', income: 520, expense: 120 },
  { day: 'Sex', income: 680, expense: 0 },
  { day: 'Sab', income: 890, expense: 45 },
  { day: 'Dom', income: 205, expense: 0 },
]

export const MOCK_TRANSACTIONS: TransactionFixture[] = [
  { id: '1', type: 'INCOME',  desc: 'Corte — Carlos Oliveira', cat: 'Serviço',  method: 'PIX',      amount: 40, time: '09:30', date: 'Hoje' },
  { id: '2', type: 'INCOME',  desc: 'Barba — Rafael Santos',   cat: 'Serviço',  method: 'Dinheiro', amount: 30, time: '10:00', date: 'Hoje' },
  { id: '3', type: 'INCOME',  desc: 'Combo — Pedro Alves',     cat: 'Serviço',  method: 'Cartão',   amount: 60, time: '10:45', date: 'Hoje' },
  { id: '4', type: 'EXPENSE', desc: 'Shampoo profissional',    cat: 'Material', method: 'Dinheiro', amount: 85, time: '11:00', date: 'Hoje' },
  { id: '5', type: 'INCOME',  desc: 'Corte — Lucas Ferreira',  cat: 'Serviço',  method: 'PIX',      amount: 40, time: '14:00', date: 'Hoje' },
  { id: '6', type: 'INCOME',  desc: 'Produto — Pomada',        cat: 'Produto',  method: 'Dinheiro', amount: 35, time: '14:30', date: 'Hoje' },
]

export const MOCK_PAYMENT_METHODS: PaymentMethodFixture[] = [
  { method: 'PIX',      total: 80, pct: 37, color: '#1B8A5A' },
  { method: 'Dinheiro', total: 65, pct: 30, color: '#F5A623' },
  { method: 'Cartão',   total: 60, pct: 28, color: '#1A3A6B' },
  { method: 'Outros',   total: 10, pct: 5,  color: '#9CA3AF' },
]

export function getInitialTransactions(): TransactionFixture[] {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'false') return []
  return MOCK_TRANSACTIONS
}

export function getInitialWeekData(): WeekDataFixture[] {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'false') return []
  return MOCK_WEEK_DATA
}

export function getInitialPaymentMethods(): PaymentMethodFixture[] {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'false') return []
  return MOCK_PAYMENT_METHODS
}
