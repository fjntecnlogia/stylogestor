/**
 * Fixtures de serviços — usados APENAS enquanto o módulo `packages/api/services`
 * não está plugado. Gated por `NEXT_PUBLIC_USE_MOCKS`. Deletar quando pronto.
 */

export interface ServiceFixture {
  id: string
  name: string
  price: number
  duration: number
  category: string
  active: boolean
  count: number
}

export const MOCK_SERVICES: ServiceFixture[] = [
  { id: '1', name: 'Corte masculino', price: 40, duration: 30, category: 'Corte',      active: true,  count: 124 },
  { id: '2', name: 'Barba',           price: 30, duration: 30, category: 'Barba',      active: true,  count: 98  },
  { id: '3', name: 'Corte + Barba',   price: 60, duration: 45, category: 'Corte',      active: true,  count: 87  },
  { id: '4', name: 'Pigmentação',     price: 80, duration: 60, category: 'Coloração',  active: true,  count: 23  },
  { id: '5', name: 'Hidratação',      price: 70, duration: 45, category: 'Tratamento', active: true,  count: 31  },
  { id: '6', name: 'Sobrancelha',     price: 20, duration: 15, category: 'Outros',     active: false, count: 12  },
]

export function getInitialServices(): ServiceFixture[] {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'false') return []
  return MOCK_SERVICES
}
