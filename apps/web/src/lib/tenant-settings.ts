/**
 * Settings configuráveis pelo gestor em /configurações → Meu negócio.
 * Persistido em Tenant.settings (JSONB).
 *
 * Defaults representam "barbearia normal" sem restrições agressivas —
 * gestor liga restrições conforme precisar.
 */
export interface TenantSettings {
  /** Permite agendar 2 clientes no mesmo profissional + horário sobrepostos. */
  allowOverlapping: boolean

  /** Cliente novo precisa OBRIGATORIAMENTE de telefone? */
  requireClientPhone: boolean

  /** Agendamento via link público vira CONFIRMED (true) ou SCHEDULED (false)? */
  autoConfirmBooking: boolean

  /**
   * Minutos de folga obrigatórios entre atendimentos do mesmo profissional.
   * Conta como "buffer" — se buffer=15 e agendamento termina às 10:00,
   * próximo só pode começar 10:15+.
   */
  defaultAppointmentBuffer: number

  /**
   * Antecedência MÍNIMA em horas pra criar agendamento.
   * Ex: 2 = não pode agendar pra daqui a 1 hora; só com 2h+ no futuro.
   * 0 = sem restrição (pode agendar a qualquer momento futuro).
   */
  bookingLeadHours: number

  /**
   * Máximo de dias à frente que se pode agendar.
   * Ex: 60 = não dá pra agendar pra 90 dias depois.
   */
  maxBookingDaysAhead: number

  /**
   * Antecedência mínima em horas pra cliente CANCELAR agendamento próprio.
   * Aplica só no booking público; gestor cancela qualquer hora.
   */
  cancelDeadlineHours: number
}

export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  allowOverlapping: false,
  requireClientPhone: true,
  autoConfirmBooking: false,
  defaultAppointmentBuffer: 0,
  bookingLeadHours: 0,
  maxBookingDaysAhead: 60,
  cancelDeadlineHours: 0,
}

/**
 * Lê settings do banco com fallback nos defaults. Json no banco pode
 * vir nulo ou parcial — esse merge garante shape completo no resto do código.
 */
export function readSettings(raw: unknown): TenantSettings {
  const s = (raw as Partial<TenantSettings> | null) ?? {}
  return {
    allowOverlapping: s.allowOverlapping === true,
    requireClientPhone: s.requireClientPhone !== false, // default true
    autoConfirmBooking: s.autoConfirmBooking === true,
    defaultAppointmentBuffer: Math.max(0, Number(s.defaultAppointmentBuffer ?? 0)),
    bookingLeadHours: Math.max(0, Number(s.bookingLeadHours ?? 0)),
    maxBookingDaysAhead: Math.max(1, Number(s.maxBookingDaysAhead ?? 60)),
    cancelDeadlineHours: Math.max(0, Number(s.cancelDeadlineHours ?? 0)),
  }
}
