/**
 * Fixtures de clientes — usados APENAS enquanto o módulo `packages/api/clients`
 * não está plugado. Gated por `NEXT_PUBLIC_USE_MOCKS` para não vazar pro build
 * de produção. Deletar quando a API estiver pronta.
 */

export interface ClientFixture {
  id: string
  name: string
  phone: string
  email: string
  visits: number
  spent: number
  lastVisit: string
  tags: string[]
  segment: 'vip' | 'risco' | 'inativo' | 'novo' | 'regular'
}

export const MOCK_CLIENTS: ClientFixture[] = [
  { id: '1', name: 'Carlos Oliveira', phone: '(11) 99999-0001', email: 'carlos@email.com', visits: 12, spent: 720,  lastVisit: '08/05/2026', tags: ['vip'],           segment: 'vip'    },
  { id: '2', name: 'Rafael Santos',   phone: '(11) 99999-0002', email: '',                 visits: 5,  spent: 200,  lastVisit: '05/05/2026', tags: [],                segment: 'risco'  },
  { id: '3', name: 'Pedro Alves',     phone: '(11) 99999-0003', email: 'pedro@email.com',  visits: 23, spent: 1380, lastVisit: '09/05/2026', tags: ['vip', 'mensal'], segment: 'vip'    },
  { id: '4', name: 'Lucas Ferreira',  phone: '(11) 99999-0004', email: '',                 visits: 3,  spent: 120,  lastVisit: '01/05/2026', tags: [],                segment: 'inativo'},
  { id: '5', name: 'André Lima',      phone: '(11) 99999-0005', email: 'andre@email.com',  visits: 8,  spent: 480,  lastVisit: '07/05/2026', tags: ['mensal'],        segment: 'regular'},
  { id: '6', name: 'Bruno Carvalho',  phone: '(11) 99999-0006', email: '',                 visits: 1,  spent: 40,   lastVisit: '02/05/2026', tags: [],                segment: 'novo'   },
  { id: '7', name: 'Diego Mendes',    phone: '(11) 99999-0007', email: 'diego@email.com',  visits: 2,  spent: 80,   lastVisit: '10/05/2026', tags: [],                segment: 'novo'   },
  { id: '8', name: 'Fábio Rocha',     phone: '(11) 99999-0008', email: '',                 visits: 15, spent: 900,  lastVisit: '03/04/2026', tags: ['vip'],           segment: 'inativo'},
]

export function getInitialClients(): ClientFixture[] {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'false') return []
  return MOCK_CLIENTS
}
