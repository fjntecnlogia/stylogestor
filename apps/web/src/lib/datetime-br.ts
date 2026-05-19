/**
 * Helpers de data/hora pro fuso de São Paulo (UTC-3).
 *
 * Servidor pode estar em UTC (VPS Hostinger geralmente está).
 * Sem cuidado, `new Date()` e `toLocaleString` no server retornam
 * UTC, não o horário do gestor BR — causa bug de "agendamento sumiu"
 * e "horário no passado" pra horários futuros.
 *
 * BRT = UTC-3 (sem horário de verão desde 2019).
 */

const BR_OFFSET_HOURS = -3

/**
 * Início do dia atual no fuso BR (em UTC absoluto).
 * Ex: se agora é 19/05 14h BRT, retorna 19/05 00:00 BRT = 19/05 03:00 UTC.
 */
export function startOfTodayBR(): Date {
  const now = new Date()
  // Construímos o "agora visto pelo BR": now + offset
  const nowBR = new Date(now.getTime() + BR_OFFSET_HOURS * 60 * 60 * 1000)
  // Quando este Date é serializado em UTC, reflete o "agora BR"
  const dayStr = nowBR.toISOString().slice(0, 10)
  // Constrói meia-noite BR em UTC absoluto
  return new Date(`${dayStr}T00:00:00.000-03:00`)
}

/** Fim do dia atual no fuso BR (23:59:59.999 BRT em UTC). */
export function endOfTodayBR(): Date {
  const start = startOfTodayBR()
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
}

/**
 * Início de um mês no fuso BR. Ex: '2026-05' → 01/05 00:00 BRT.
 */
export function startOfMonthBR(year: number, month: number /* 0-indexed */): Date {
  const m = String(month + 1).padStart(2, '0')
  return new Date(`${year}-${m}-01T00:00:00.000-03:00`)
}

/** String 'YYYY-MM-DD' representando o dia atual no fuso BR. */
export function todayDateStrBR(): string {
  const now = new Date()
  const nowBR = new Date(now.getTime() + BR_OFFSET_HOURS * 60 * 60 * 1000)
  return nowBR.toISOString().slice(0, 10)
}
