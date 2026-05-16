import { useEffect, useRef } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import { registerForPushNotifications, savePushToken } from '../lib/notifications'

export default function RootLayout() {
  const notificationListener = useRef<Notifications.EventSubscription>()
  const responseListener      = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    // Registrar push token
    registerForPushNotifications().then((token) => {
      if (token) {
        // TODO: passar tenantId real do contexto de autenticação
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
    <>
      <StatusBar style="light" backgroundColor="#1A3A6B" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}
