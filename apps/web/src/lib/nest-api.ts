'use client'

/**
 * Cliente client-side pra chamar a API NestJS (api.stylogestor.com.br)
 * autenticado com o JWT do Supabase.
 *
 * Fase 3 (login único): o backend valida `Authorization: Bearer <JWT
 * Supabase>` via MultiAuthGuard. Algumas rotas (scoped por tenant)
 * também exigem o header `x-tenant-slug`.
 *
 * Por que client-side (e não via route handler Next)?
 *   - Os endpoints que mexem em app_metadata (tour-completed,
 *     reset-onboarding, sync-claims) exigem `supabase.auth.refreshSession()`
 *     DEPOIS da chamada — e refreshSession é client-side. Chamando o
 *     NestJS direto do client, o refresh acontece naturalmente na mesma
 *     função, sem hop extra pelo Next.
 *   - CORS já liberado no NestJS pra *.stylogestor.com.br.
 *
 * O token vem de `supabase.auth.getSession()` (cookie/localStorage do
 * @supabase/ssr no browser).
 */

import { createClient } from './supabase/client'

// NEXT_PUBLIC_API_URL é a BASE da API (sem path) — mesma convenção do
// middleware.ts, que monta `${base}/api/v1/...`. Na VPS a env está como
// https://api.stylogestor.com.br (SEM /api/v1), então adicionamos o prefixo
// aqui. Sem isso as chamadas iam pra https://api.stylogestor.com.br/me/...
// → 404 (o NestJS tem globalPrefix 'api/v1'). O endsWith torna resiliente
// caso a env venha com o prefixo (ex.: dev local).
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.stylogestor.com.br').replace(/\/+$/, '')
const API_URL = API_BASE.endsWith('/api/v1') ? API_BASE : `${API_BASE}/api/v1`

export class NestApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'NestApiError'
    this.status = status
  }
}

interface NestFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** Header x-tenant-slug — obrigatório nas rotas scoped por tenant */
  tenantSlug?: string
}

/**
 * Faz uma chamada autenticada ao NestJS. Lança NestApiError se !ok.
 * Retorna o JSON parseado (ou {} se sem corpo).
 */
export async function nestFetch<T = unknown>(
  path: string,
  options: NestFetchOptions = {},
): Promise<T> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const token = session?.access_token
  if (!token) {
    throw new NestApiError('Sessão expirada — faça login de novo.', 401)
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
  if (options.tenantSlug) headers['x-tenant-slug'] = options.tenantSlug

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const msg =
      (data as { message?: string; error?: string }).message ||
      (data as { error?: string }).error ||
      `Erro ${res.status}`
    throw new NestApiError(msg, res.status)
  }

  // Algumas respostas (204) não têm corpo
  return res.json().catch(() => ({} as T))
}

/**
 * Atalho pros endpoints que alteram app_metadata: chama o NestJS e já
 * faz o refreshSession() (sem isso o JWT segue com os claims antigos e
 * o middleware lê valor velho).
 */
export async function nestFetchWithRefresh<T = unknown>(
  path: string,
  options: NestFetchOptions = {},
): Promise<T> {
  const result = await nestFetch<T>(path, options)
  const supabase = createClient()
  await supabase.auth.refreshSession()
  return result
}
