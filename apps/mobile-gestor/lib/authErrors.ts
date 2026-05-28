// Mapeia erros do Supabase Auth para mensagens em PT-BR.
// Inspirado no antigo lib/clerkErrors.ts.

import type { AuthError } from '@supabase/supabase-js'

const MAP: Record<string, string> = {
  // Credenciais
  invalid_credentials: 'E-mail ou senha incorretos. Verifique e tente novamente.',
  email_not_confirmed: 'E-mail não verificado. Confira sua caixa de entrada e clique no link de confirmação.',
  user_not_found: 'Conta não encontrada. Faça o cadastro primeiro.',

  // Cadastro
  user_already_exists: 'Já existe uma conta com esse e-mail. Faça login.',
  signup_disabled: 'Cadastros estão temporariamente desativados.',
  weak_password: 'Senha muito fraca. Use pelo menos 8 caracteres, com letras e números.',
  email_address_invalid: 'E-mail inválido. Verifique o formato.',
  email_address_not_authorized: 'Esse e-mail não está autorizado.',

  // Verificação
  otp_expired: 'O código expirou. Solicite um novo.',
  otp_disabled: 'Verificação por código está desativada.',
  token_not_found: 'Link inválido ou expirado.',

  // Sessão
  refresh_token_not_found: 'Sessão expirou. Faça login novamente.',
  session_not_found: 'Sessão expirou. Faça login novamente.',

  // Limites / rate
  over_email_send_rate_limit: 'Muitas tentativas. Aguarde alguns minutos antes de tentar de novo.',
  over_request_rate_limit: 'Muitas requisições. Aguarde um momento.',

  // Genéricos
  unexpected_failure: 'Algo deu errado. Tente novamente.',
  validation_failed: 'Dados inválidos. Verifique e tente novamente.',
}

export function authErrorMessage(err: unknown, fallback = 'Erro inesperado. Tente novamente.'): string {
  if (!err) return fallback

  // Erro do Supabase
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = String((err as AuthError).code)
    if (MAP[code]) return MAP[code]
    // tenta extrair mensagem se o code não mapeou
    if ('message' in err) {
      const msg = String((err as Error).message)
      // alguns erros vêm com mensagem livre — heurística pra mensagens conhecidas
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
