import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '../lib/auth'

// Auth migrada de Clerk Expo → Supabase Auth.
// O AuthProvider expõe useAuth() e useUser() via Context, lendo do
// expo-secure-store onde a sessão JWT fica criptografada.
//
// TODO: religar expo-notifications quando houver expo-modules-core 3.1+ estável.
// A v0.32.x do expo-notifications foi compilada esperando API mais nova de modules-core,
// causando InstantiationError(AsyncFunctionComponent) ao boot com modules-core 3.0.30.
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#1A3A6B" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  )
}
