import { View, ActivityIndicator } from 'react-native'
import { Stack, Redirect } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth()

  // Aguarda Clerk hidratar a sessao do SecureStore antes de decidir
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A3A6B' }}>
        <ActivityIndicator color="#F5A623" size="large" />
      </View>
    )
  }

  // Se ja esta logado, nao faz sentido renderizar login/cadastro:
  // manda direto pras tabs. Evita o erro session_exists do Clerk
  // quando o usuario navega de volta pra /(auth)/login sem deslogar.
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
