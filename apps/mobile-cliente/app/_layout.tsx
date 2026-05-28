import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '../lib/auth'

// IMPORTANTE: app cliente é híbrido — usuário pode usar TUDO sem login.
// Login destrava benefícios (histórico, pre-fill, fidelidade futura) mas
// NUNCA bloqueia o fluxo de agendamento. Por isso não há guards em layouts
// nem redirect automático. As (auth) screens existem mas o usuário nunca
// é forçado a passar por elas.
//
// Auth migrada de Clerk Expo → Supabase Auth.
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#1A3A6B" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  )
}
