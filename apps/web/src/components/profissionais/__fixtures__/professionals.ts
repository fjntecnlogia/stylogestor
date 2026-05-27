/**
 * Fixtures de profissionais — usados APENAS enquanto o módulo
 * `packages/api/professionals` não está plugado. Gated por
 * `NEXT_PUBLIC_USE_MOCKS`. Deletar quando a API estiver pronta.
 */

export interface ProfessionalSchedule {
  day: number
  start: string
  end: string
}

export interface ProfessionalStats {
  month: number
  revenue: number
  commission: number
}

export interface ProfessionalFixture {
  id: string
  name: string
  role: string
  phone: string
  commission: number
  active: boolean
  /** Setado quando o convite Clerk é enviado. Vazio = sem conta de login ainda. */
  email?: string
  schedules: ProfessionalSchedule[]
  stats: ProfessionalStats
}

export const MOCK_PROFESSIONALS: ProfessionalFixture[] = [
  {
    id: '1', name: 'João Silva', role: 'Barbeiro', phone: '(11) 99999-0001',
    commission: 40, active: true,
    schedules: [
      { day: 1, start: '09:00', end: '18:00' }, { day: 2, start: '09:00', end: '18:00' },
      { day: 3, start: '09:00', end: '18:00' }, { day: 4, start: '09:00', end: '18:00' },
      { day: 5, start: '09:00', end: '18:00' }, { day: 6, start: '09:00', end: '14:00' },
    ],
    stats: { month: 28, revenue: 2240, commission: 896 },
  },
  {
    id: '2', name: 'Pedro Costa', role: 'Cabeleireiro', phone: '(11) 99999-0002',
    commission: 35, active: true,
    schedules: [
      { day: 1, start: '10:00', end: '19:00' }, { day: 2, start: '10:00', end: '19:00' },
      { day: 3, start: '10:00', end: '19:00' }, { day: 4, start: '10:00', end: '19:00' },
      { day: 5, start: '10:00', end: '19:00' },
    ],
    stats: { month: 19, revenue: 1520, commission: 532 },
  },
]

export function getInitialProfessionals(): ProfessionalFixture[] {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'false') return []
  return MOCK_PROFESSIONALS
}
