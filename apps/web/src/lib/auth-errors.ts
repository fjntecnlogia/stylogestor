// Mensagens de erro de auth do Supabase em PT-BR (web).
// Espelha o lib/authErrors.ts do mobile pra consistência.

export function authErrorMessage(
  message: string | undefined,
  fallback = 'Ocorreu um erro. Tente novamente.',
): string {
  const m = (message || '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Esse e-mail já tem conta. Faça login ou recupere a senha.'
  if (m.includes('password should be at least')) return 'A senha deve ter no mínimo 8 caracteres.'
  if (m.includes('token has expired') || m.includes('invalid token') || m.includes('otp'))
    return 'Código inválido ou expirado. Solicite um novo.'
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Muitas tentativas. Aguarde um pouco e tente de novo.'
  if (m.includes('for security purposes')) return 'Aguarde alguns segundos antes de tentar de novo.'
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'E-mail inválido.'
  return fallback
}
