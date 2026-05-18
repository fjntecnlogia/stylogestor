import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SecureStore from 'expo-secure-store'
import { ClerkProvider } from '@clerk/clerk-expo'

// Token cache via expo-secure-store (Keystore Android / Keychain iOS).
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value)
    } catch {
      return
    }
  },
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
if (!publishableKey) {
  throw new Error('Falta EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY no .env do mobile-cliente')
}

// IMPORTANTE: app cliente e hibrido - usuario pode usar TUDO sem login.
// Login destrava beneficios (historico, pre-fill, fidelidade futura) mas
// NUNCA bloqueia o fluxo de agendamento. Por isso nao ha guards em layouts
// nem redirect automatico. As (auth) screens existem mas o usuario nunca
// e forcado a passar por elas.
export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <StatusBar style="light" backgroundColor="#1A3A6B" />
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  )
}
