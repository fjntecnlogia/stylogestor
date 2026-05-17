/**
 * Fixtures de clientes do programa de fidelidade — usados APENAS enquanto
 * o módulo `packages/api/loyalty` não está plugado. Gated por
 * `NEXT_PUBLIC_USE_MOCKS`. Deletar quando pronto.
 */

export interface ClienteFidelidadeFixture {
  id: string
  name: string
  phone: string
  stamps: number
  points: number
  tier: 'bronze' | 'prata' | 'ouro' | 'vip'
  totalVisits: number
  nextReward: number
}

export const MOCK_CLIENTES_FIDELIDADE: ClienteFidelidadeFixture[] = [
  { id: '1', name: 'Pedro Alves',     phone: '(11) 99999-0003', stamps: 8, points: 1380, tier: 'ouro',   totalVisits: 23, nextReward: 2  },
  { id: '2', name: 'Carlos Oliveira', phone: '(11) 99999-0001', stamps: 5, points: 720,  tier: 'prata',  totalVisits: 12, nextReward: 5  },
  { id: '3', name: 'André Lima',      phone: '(11) 99999-0005', stamps: 3, points: 480,  tier: 'bronze', totalVisits: 8,  nextReward: 7  },
  { id: '4', name: 'Rafael Santos',   phone: '(11) 99999-0002', stamps: 2, points: 200,  tier: 'bronze', totalVisits: 5,  nextReward: 8  },
  { id: '5', name: 'Lucas Ferreira',  phone: '(11) 99999-0004', stamps: 1, points: 120,  tier: 'bronze', totalVisits: 3,  nextReward: 9  },
  { id: '6', name: 'Bruno Carvalho',  phone: '(11) 99999-0006', stamps: 0, points: 40,   tier: 'bronze', totalVisits: 1,  nextReward: 10 },
]

export function getInitialClientesFidelidade(): ClienteFidelidadeFixture[] {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'false') return []
  return MOCK_CLIENTES_FIDELIDADE
}
