// Mapa de erros do Clerk Expo SDK para mensagens em PT-BR personalizadas.
// O Clerk retorna err.errors[].code (estavel) e longMessage (em ingles).
// Mapeamos os codigos mais comuns; quando nao reconhecido, caimos na
// longMessage do servidor (melhor que mostrar texto generico).
//
// Lista de codigos: https://clerk.com/docs/errors/overview

type ClerkRawError = {
  code?: string
  longMessage?: string
  message?: string
  meta?: { paramName?: string }
}

const PT_BR_MAP: Record<string, string> = {
  // ── Sign in (login) ───────────────────────────────────────────
  form_identifier_not_found:
    'Nao encontramos uma conta com esse e-mail. Confira ou crie uma conta nova.',
  form_password_incorrect:
    'Senha incorreta. Tente de novo ou use "Esqueci minha senha".',
  session_exists:
    'Voce ja esta logado. Feche e abra o app novamente.',
  identifier_already_signed_in:
    'Ja existe uma sessao ativa para este e-mail.',
  strategy_for_user_invalid:
    'Esse e-mail nao usa senha. Tente outra forma de login.',

  // ── Sign up (cadastro) ────────────────────────────────────────
  form_identifier_exists:
    'Ja existe uma conta com esse e-mail. Entre em vez de cadastrar.',
  form_password_pwned:
    'Essa senha apareceu em vazamentos publicos. Use uma senha unica e forte (sugestao: combine palavras + numeros, ex.: "agendar-azul-corte-9742").',
  form_password_length_too_short:
    'Senha muito curta. Use no minimo 8 caracteres.',
  form_password_size_in_bytes_exceeded:
    'Senha muito longa. Use ate 72 caracteres.',
  form_password_not_strong_enough:
    'Senha muito previsivel. Misture letras, numeros e simbolos.',
  form_password_validation_failed:
    'Senha nao atende aos requisitos de seguranca.',
  form_password_complexity:
    'Senha muito simples. Combine letras maiusculas, minusculas, numeros e simbolos.',
  form_param_format_invalid:
    'Formato invalido. Confira os dados digitados.',

  // ── Verificacao de email ──────────────────────────────────────
  form_code_incorrect:
    'Codigo invalido. Confira no e-mail e digite os 6 numeros.',
  verification_expired:
    'Esse codigo expirou. Peca um novo na tela de cadastro.',
  verification_already_verified:
    'Este e-mail ja foi verificado. Volte e faca login.',
  verification_failed:
    'Verificacao falhou. Tente novamente ou peca um novo codigo.',
  verification_missing:
    'Codigo nao informado.',

  // ── Erros de rede / genericos ─────────────────────────────────
  network_error:
    'Sem conexao com o servidor. Confira sua internet.',
  fetch_network_error:
    'Sem conexao com o servidor. Confira sua internet.',
  form_param_nil:
    'Preencha todos os campos obrigatorios.',
  form_param_missing:
    'Preencha todos os campos obrigatorios.',
}

function byParam(code: string | undefined, paramName: string | undefined): string | null {
  if (code === 'form_param_format_invalid' && paramName === 'email_address') {
    return 'E-mail invalido. Use o formato seu@dominio.com.'
  }
  if (code === 'form_param_format_invalid' && paramName === 'password') {
    return 'Formato de senha invalido.'
  }
  if ((code === 'form_param_missing' || code === 'form_param_nil') && paramName === 'email_address') {
    return 'Preencha o e-mail.'
  }
  if ((code === 'form_param_missing' || code === 'form_param_nil') && paramName === 'password') {
    return 'Preencha a senha.'
  }
  if ((code === 'form_param_missing' || code === 'form_param_nil') && paramName === 'code') {
    return 'Digite o codigo de verificacao recebido por e-mail.'
  }
  return null
}

/**
 * Extrai mensagem amigavel em PT-BR de qualquer erro do Clerk Expo.
 */
export function clerkErrorMessage(err: unknown, fallback: string): string {
  const e = err as { errors?: ClerkRawError[] }
  const first = e?.errors?.[0]
  if (!first) return fallback

  const byParamHit = byParam(first.code, first.meta?.paramName)
  if (byParamHit) return byParamHit

  if (first.code && PT_BR_MAP[first.code]) return PT_BR_MAP[first.code]

  return first.longMessage || first.message || fallback
}
