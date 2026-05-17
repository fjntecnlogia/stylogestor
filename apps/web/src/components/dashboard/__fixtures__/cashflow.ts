/**
 * Fixtures de fluxo de caixa do dashboard — usados APENAS enquanto não há
 * `/api/reports/cashflow`. Gated por `NEXT_PUBLIC_USE_MOCKS`.
 */

export interface CashflowEntryFixture {
  label: string
  value: number
  type: 'in' | 'out'
  method: 'PIX' | 'Dinheiro' | 'Cartão' | string
}

export interface WeekDayFixture {
  day: string
  v: number
}

export const MOCK_ENTRIES: CashflowEntryFixture[] = [
  { label: 'Cortes (8x)',     value: 440, type: 'in',  method: 'PIX'      },
  { label: 'Barba (5x)',      value: 200, type: 'in',  method: 'Dinheiro' },
  { label: 'Combo (4x)',      value: 480, type: 'in',  method: 'Cartão'   },
  { label: 'Produtos',        value: 120, type: 'in',  method: 'Dinheiro' },
  { label: 'Material compra', value: 85,  type: 'out', method: 'Dinheiro' },
]

export const MOCK_WEEK: WeekDayFixture[] = [
  { day: 'Seg', v: 320 },
  { day: 'Ter', v: 450 },
  { day: 'Qua', v: 280 },
  { day: 'Qui', v: 520 },
  { day: 'Sex', v: 680 },
  { day: 'Sab', v: 890 },
  { day: 'Dom', v: 205 },
]

export function getInitialEntries(): CashflowEntryFixture[] {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'false') return []
  return MOCK_ENTRIES
}

export function getInitialWeek(): WeekDayFixture[] {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'false') return []
  return MOCK_WEEK
}
