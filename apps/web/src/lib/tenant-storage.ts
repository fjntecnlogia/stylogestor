'use client'

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { useUser } from './use-user'

/**
 * Storage scoped por tenant pra persistir state simples no browser.
 *
 * Workaround enquanto `packages/api` não tem CRUDs plugados — quando a API
 * real chegar, trocar `useTenantPersistedState` por `useQuery`/`useSWR`
 * apontando pra `/api/...`.
 *
 * A chave final no localStorage fica: `stylogestor:{tenantSlug}:{key}`.
 * Isso impede vazamento de dados entre barbearias quando o gestor usa o
 * mesmo navegador pra logar em contas diferentes.
 */

const PREFIX = 'stylogestor'

function fullKey(tenantSlug: string, key: string): string {
  return `${PREFIX}:${tenantSlug}:${key}`
}

export function loadFromTenantStorage<T>(
  key: string,
  tenantSlug: string | undefined,
): T | undefined {
  if (typeof window === 'undefined' || !tenantSlug) return undefined
  try {
    const raw = window.localStorage.getItem(fullKey(tenantSlug, key))
    if (!raw) return undefined
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

export function saveToTenantStorage<T>(
  key: string,
  tenantSlug: string | undefined,
  value: T,
): void {
  if (typeof window === 'undefined' || !tenantSlug) return
  try {
    window.localStorage.setItem(fullKey(tenantSlug, key), JSON.stringify(value))
  } catch {
    // QuotaExceeded / modo privado / localStorage desabilitado — ignora.
  }
}

export function clearTenantStorage(tenantSlug: string | undefined): void {
  if (typeof window === 'undefined' || !tenantSlug) return
  try {
    const prefix = `${PREFIX}:${tenantSlug}:`
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(prefix)) keys.push(k)
    }
    keys.forEach((k) => window.localStorage.removeItem(k))
  } catch {
    // ignora
  }
}

/**
 * Drop-in replacement pra `useState` que persiste o valor no localStorage
 * isolado por tenant. Carrega no mount uma vez (após Clerk resolver),
 * salva sempre que o valor muda.
 *
 * Uso:
 * ```tsx
 *   const [clients, setClients] = useTenantPersistedState('clients', initial)
 * ```
 *
 * Comportamento:
 * - SSR / antes do Clerk carregar: usa `initial`
 * - Após Clerk resolver com `tenantSlug`: tenta hidratar do localStorage; se
 *   tiver valor salvo, substitui o `initial`
 * - A cada mudança subsequente do state, persiste no localStorage do tenant
 * - Se `tenantSlug` for `undefined` (cadastro incompleto): não persiste nada,
 *   só guarda em memória (próximo reload perde — comportamento intencional)
 */
export function useTenantPersistedState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const { user, isLoaded } = useUser()
  const tenantSlug = (user?.app_metadata as { tenantSlug?: string } | undefined)?.tenantSlug

  const [value, setValue] = useState<T>(initial)
  const hydratedRef = useRef(false)

  // 1) Hidrata uma única vez quando o Clerk resolve e temos tenantSlug.
  // Carregamento de external system → setState aqui é o padrão recomendado
  // pelo React; o lint react-hooks/set-state-in-effect fira mas o caso é legítimo.
  useEffect(() => {
    if (!isLoaded || !tenantSlug || hydratedRef.current) return
    const stored = loadFromTenantStorage<T>(key, tenantSlug)
    if (stored !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratação one-shot de external store
      setValue(stored)
    }
    hydratedRef.current = true
  }, [isLoaded, tenantSlug, key])

  // 2) Persiste a cada mudança após hidratação.
  useEffect(() => {
    if (!hydratedRef.current || !tenantSlug) return
    saveToTenantStorage(key, tenantSlug, value)
  }, [value, tenantSlug, key])

  return [value, setValue]
}
