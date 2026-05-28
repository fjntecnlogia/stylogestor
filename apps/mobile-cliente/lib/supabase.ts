// Cliente Supabase para o mobile-cliente.
// Idêntico ao do mobile-gestor: usa expo-secure-store pra JWT persistente,
// processLock pra evitar race condition em refresh paralelo.

import 'react-native-url-polyfill/auto'
import { createClient, processLock } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!SUPABASE_URL) {
  throw new Error('Falta EXPO_PUBLIC_SUPABASE_URL no eas.json env do mobile-cliente')
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('Falta EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY no eas.json env do mobile-cliente')
}

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
    detectSessionInUrl: false,
    lock: processLock,
  },
})
