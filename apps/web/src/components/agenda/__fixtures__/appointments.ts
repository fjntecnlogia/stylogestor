/**
 * Fixtures de agendamentos pro app web — usados APENAS enquanto o módulo
 * `packages/api/appointments` não está plugado. Carregados condicionalmente
 * via `NEXT_PUBLIC_USE_MOCKS=true` (default em dev) para evitar que dados
 * fake vazem pro build de produção.
 *
 * Quando a API estiver pronta, deletar esse arquivo + remover o fallback
 * em agenda-view.tsx.
 */

export interface AppointmentFixture {
  id: string
  professionalId: string
  client: string
  phone: string
  service: string
  price: number
  discount: number
  payMethod: string
  start: string
  end: string
  status: 'COMPLETED' | 'CONFIRMED' | 'SCHEDULED' | 'IN_PROGRESS' | 'CANCELED' | 'NO_SHOW'
  duration: number
  note: string
}

export const MOCK_APPOINTMENTS: AppointmentFixture[] = [
  { id: '1', professionalId: '1', client: 'Carlos Oliveira', phone: '(11)99999-0001', service: 'Corte + Barba', price: 60, discount: 0, payMethod: 'PIX',      start: '09:00', end: '09:45', status: 'COMPLETED',   duration: 45, note: '' },
  { id: '2', professionalId: '1', client: 'Rafael Santos',   phone: '(11)99999-0002', service: 'Corte',         price: 40, discount: 0, payMethod: 'Dinheiro', start: '10:00', end: '10:30', status: 'COMPLETED',   duration: 30, note: '' },
  { id: '3', professionalId: '2', client: 'Pedro Alves',     phone: '(11)99999-0003', service: 'Barba',         price: 30, discount: 5, payMethod: 'Cartão',   start: '09:30', end: '10:00', status: 'CONFIRMED',   duration: 30, note: 'Cliente VIP' },
  { id: '4', professionalId: '1', client: 'Lucas Ferreira',  phone: '(11)99999-0004', service: 'Corte',         price: 40, discount: 0, payMethod: '',         start: '14:00', end: '14:30', status: 'SCHEDULED',   duration: 30, note: '' },
  { id: '5', professionalId: '2', client: 'André Lima',      phone: '(11)99999-0005', service: 'Corte + Barba', price: 60, discount: 0, payMethod: 'PIX',      start: '14:30', end: '15:15', status: 'SCHEDULED',   duration: 45, note: '' },
  { id: '6', professionalId: '1', client: 'Bruno Carvalho',  phone: '(11)99999-0006', service: 'Corte',         price: 40, discount: 0, payMethod: '',         start: '15:00', end: '15:30', status: 'IN_PROGRESS', duration: 30, note: '' },
]

/** Resolve qual conjunto inicial de agendamentos usar (flag de mocks). */
export function getInitialAppointments(): AppointmentFixture[] {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'false') return []
  return MOCK_APPOINTMENTS
}
