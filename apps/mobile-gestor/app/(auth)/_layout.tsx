import { View, ActivityIndicator } from 'react-native'
import { Stack, Redirect } from 'expo-router'
import { useAuth } from '../../lib/auth'

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth()

  // Aguarda Supabase hidratar a sessão do SecureStore antes de decidir
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A3A6B' }}>
        <ActivityIndicator color="#F5A623" size="large" />
      </View>
    )
  }

  // Se já está logado, manda direto pras tabs (evita ver login/cadastro logado)
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
