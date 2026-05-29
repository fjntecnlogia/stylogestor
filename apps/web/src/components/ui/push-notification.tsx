'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/toast'

// Lembra a dispensa ("Não agora") pra não reaparecer todo reload.
const DISMISS_KEY = 'sg_push_dismissed'

type Status = 'loading' | 'prompt' | 'granted' | 'denied' | 'unsupported' | 'dismissed'

export function PushNotificationSetup() {
  // 'loading' inicial evita flash do card antes de checarmos a permissão.
  const [status, setStatus] = useState<Status>('loading')
  const [requesting, setRequesting] = useState(false)
  const { success, info, warning } = useToast()

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setStatus('unsupported')
      return
    }
    // Browser já decidiu? respeita.
    if (Notification.permission === 'granted') return setStatus('granted')
    if (Notification.permission === 'denied') return setStatus('denied')
    // permission === 'default': mostra o card, a menos que o user já tenha dispensado.
    let dismissed = false
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1' } catch { /* storage bloqueado */ }
    setStatus(dismissed ? 'dismissed' : 'prompt')
  }, [])

  const requestPermission = async () => {
    setRequesting(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        setStatus('granted')
        success('Notificações ativadas! Você será avisado sobre novos agendamentos. 🔔')
        try {
          new Notification('STYLOGESTOR', {
            body: 'Notificações ativadas! Você será avisado sobre novos agendamentos.',
            icon: '/favicon.ico',
          })
        } catch { /* alguns navegadores exigem service worker — ignora */ }
      } else {
        // Negado no prompt OU já bloqueado pelo navegador (não reabre o prompt).
        setStatus('denied')
        warning('Permissão negada. Pra ativar, clique no 🔒 da barra de endereço → Notificações → Permitir.')
      }
    } catch {
      setStatus('denied')
      warning('Não foi possível ativar as notificações neste navegador.')
    } finally {
      setRequesting(false)
    }
  }

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* storage bloqueado */ }
    setStatus('dismissed')
    info('Sem problemas! Você pode ativar depois em Configurações.')
  }

  // Só aparece quando a permissão está pendente (default) e não foi dispensada.
  if (status !== 'prompt') return null

  return (
    <div className="fixed bottom-20 right-5 z-40 bg-[#1A3A6B] text-white rounded-2xl shadow-xl p-4 max-w-xs">
      <p className="font-sora font-bold text-sm mb-1">🔔 Ativar notificações</p>
      <p className="text-white/70 text-xs mb-3">Receba alertas de novos agendamentos em tempo real.</p>
      <div className="flex gap-2">
        <button
          onClick={requestPermission}
          disabled={requesting}
          className="flex-1 bg-[#F5A623] disabled:opacity-60 text-[#1A3A6B] text-xs font-bold py-2 rounded-xl hover:bg-[#e09610] transition-colors"
        >
          {requesting ? 'Aguarde...' : 'Ativar'}
        </button>
        <button
          onClick={dismiss}
          disabled={requesting}
          className="text-white/60 text-xs px-2 hover:text-white transition-colors"
        >
          Não agora
        </button>
      </div>
    </div>
  )
}

export function sendPushNotification(title: string, body: string) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico' })
    } catch { /* ignora se o navegador exigir service worker */ }
  }
}
