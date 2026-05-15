import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

// ── Configuração global ─────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// ── Registro do Push Token ──────────────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[PUSH] Emulador não suporta push notifications reais')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('[PUSH] Permissão negada')
    return null
  }

  // Android: canal de notificação
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'STYLOGESTOR',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F5A623',
      sound: 'default',
    })

    await Notifications.setNotificationChannelAsync('agendamentos', {
      name: 'Agendamentos',
      description: 'Notificações de novos agendamentos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1A3A6B',
      sound: 'default',
    })
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) {
    console.warn('[PUSH] EAS projectId não encontrado no app.json')
    return null
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
    console.log('[PUSH] Token:', tokenData.data)
    return tokenData.data
  } catch (err) {
    console.error('[PUSH] Erro ao obter token:', err)
    return null
  }
}

// ── Salvar token no backend ─────────────────────────────────────
export async function savePushToken(token: string, tenantId: string) {
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.stylogestor.com.br'
  try {
    await fetch(`${API_URL}/api/v1/notifications/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, tenantId, platform: Platform.OS }),
    })
  } catch (err) {
    console.error('[PUSH] Erro ao salvar token:', err)
  }
}

// ── Notificação local (sem internet) ───────────────────────────
export async function scheduleLocalNotification(params: {
  title: string
  body: string
  data?: Record<string, unknown>
  seconds?: number
  channelId?: string
}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data ?? {},
      sound: 'default',
    },
    trigger: params.seconds
      ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: params.seconds }
      : null,
  })
}

// ── Helpers de notificações específicas ────────────────────────
export const pushNotifications = {
  novoAgendamento: (clientName: string, time: string) =>
    scheduleLocalNotification({
      title: '📅 Novo agendamento!',
      body: `${clientName} marcou para às ${time}`,
      channelId: 'agendamentos',
    }),

  agendamentoHoje: (count: number) =>
    scheduleLocalNotification({
      title: '🗓️ Sua agenda de hoje',
      body: `Você tem ${count} agendamento${count > 1 ? 's' : ''} para hoje`,
      channelId: 'agendamentos',
    }),

  lembreteEstoque: (productName: string) =>
    scheduleLocalNotification({
      title: '📦 Estoque baixo',
      body: `${productName} está abaixo do mínimo`,
    }),

  pagamentoRecebido: (amount: string) =>
    scheduleLocalNotification({
      title: '💰 Pagamento recebido',
      body: `R$ ${amount} adicionado ao caixa`,
    }),
}
