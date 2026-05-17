import { useEffect, useRef } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { ClerkProvider } from '@clerk/clerk-expo'
import { registerForPushNotifications, savePushToken } from '../lib/notifications'

// Token cache para o Clerk usar via expo-secure-store (Keystore Android / Keychain iOS).
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
  // Fail fast em build — sem chave nada de Clerk funciona.
  throw new Error('Falta EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY no .env do mobile-gestor')
}

export default function RootLayout() {
  const notificationListener = useRef<Notifications.EventSubscription>()
  const responseListener      = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    // Registrar push token
    registerForPushNotifications().then((token) => {
      if (token) {
        // TODO: passar tenantId real do contexto de autenticação (Clerk publicMetadata.tenantId)
        savePushToken(token, 'default')
      }
    })

    // Listener: notificação recebida com app aberto
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[PUSH] Recebida:', notification.request.content.title)
    })

    // Listener: usuário tocou na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data
      console.log('[PUSH] Tocou:', data)
      // Navegar para tela relevante baseado em data.screen
    })

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <StatusBar style="light" backgroundColor="#1A3A6B" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ClerkProvider>
  )
}
