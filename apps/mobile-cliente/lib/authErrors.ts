// Mapeia erros do Supabase Auth para mensagens em PT-BR.

import type { AuthError } from '@supabase/supabase-js'

const MAP: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'E-mail não verificado. Confira sua caixa de entrada.',
  user_not_found: 'Conta não encontrada. Faça o cadastro primeiro.',
  user_already_exists: 'Já existe uma conta com esse e-mail. Faça login.',
  signup_disabled: 'Cadastros estão temporariamente desativados.',
  weak_password: 'Senha muito fraca. Use pelo menos 8 caracteres.',
  email_address_invalid: 'E-mail inválido. Verifique o formato.',
  otp_expired: 'O código expirou. Solicite um novo.',
  otp_disabled: 'Verificação por código está desativada.',
  token_not_found: 'Link inválido ou expirado.',
  refresh_token_not_found: 'Sessão expirou. Faça login novamente.',
  session_not_found: 'Sessão expirou. Faça login novamente.',
  over_email_send_rate_limit: 'Muitas tentativas. Aguarde alguns minutos.',
  over_request_rate_limit: 'Muitas requisições. Aguarde um momento.',
  unexpected_failure: 'Algo deu errado. Tente novamente.',
  validation_failed: 'Dados inválidos. Verifique e tente novamente.',
}

export function authErrorMessage(err: unknown, fallback = 'Erro inesperado. Tente novamente.'): string {
  if (!err) return fallback
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = String((err as AuthError).code)
    if (MAP[code]) return MAP[code]
    if ('message' in err) {
      const msg = String((err as Error).message)
      if (/Invalid login credentials/i.test(msg)) return MAP.invalid_credentials
      if (/Email not confirmed/i.test(msg)) return MAP.email_not_confirmed
      if (/User already registered/i.test(msg)) return MAP.user_already_exists
      if (/Password should be at least/i.test(msg)) return MAP.weak_password
      return msg
    }
  }
  if (err instanceof Error) return err.message
  return fallback
}
