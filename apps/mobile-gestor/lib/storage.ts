// Wrapper tipado pra persistir JSON arrays / objetos via expo-secure-store.
// Reusavel pra Profissionais, Servicos, Estoque, etc. enquanto a API real
// nao existe. Quando plugar backend: substituir as 3 funcoes por chamadas
// HTTP mantendo a mesma assinatura (todos os hooks/componentes ja consomem).
//
// SecureStore tem limite de ~2KB por valor no Android, ~4KB iOS. Pra listas
// grandes (50+ items detalhados) usar AsyncStorage seria mais seguro. Como
// estamos no MVP de teste, mantemos SecureStore (sem deps novas).

import * as SecureStore from 'expo-secure-store'

export async function loadArray<T>(key: string): Promise<T[]> {
  try {
    const raw = await SecureStore.getItemAsync(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as T[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveArray<T>(key: string, items: T[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(items))
  } catch (err) {
    console.warn(`[storage] Falha ao salvar ${key}:`, err)
  }
}

export async function loadObject<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await SecureStore.getItemAsync(key)
    if (!raw) return fallback
    return { ...fallback, ...(JSON.parse(raw) as T) }
  } catch {
    return fallback
  }
}

export async function saveObject<T>(key: string, obj: T): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(obj))
  } catch (err) {
    console.warn(`[storage] Falha ao salvar ${key}:`, err)
  }
}

export function newId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
}
