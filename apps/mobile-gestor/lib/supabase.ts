// Cliente Supabase para o mobile-gestor.
// Usa expo-secure-store (criptografado) pra persistir a sessão JWT
// no Keystore (Android) / Keychain (iOS), em vez do AsyncStorage padrão.

import 'react-native-url-polyfill/auto'
import { createClient, processLock } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!SUPABASE_URL) {
  throw new Error('Falta EXPO_PUBLIC_SUPABASE_URL no eas.json env do mobile-gestor')
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('Falta EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY no eas.json env do mobile-gestor')
}

// Adapter de Storage usando expo-secure-store.
// Implementa a interface esperada pelo Supabase Auth (getItem/setItem/removeItem).
// Chunk size de 2048 bytes pq SecureStore tem limite por valor no Android.
const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch (err) {
      console.warn('[supabase] setItem falhou:', err)
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (err) {
      console.warn('[supabase] removeItem falhou:', err)
    }
  },
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // mobile não usa URL pra detectar callback
    lock: processLock,         // evita race condition em refresh paralelo
  },
})
