'use client'

import { useEffect, useState } from 'react'

export function PushNotificationSetup() {
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle')

  useEffect(() => {
    if (!('Notification' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'granted') setStatus('granted')
    else if (Notification.permission === 'denied') setStatus('denied')
  }, [])

  const requestPermission = async () => {
    const perm = await Notification.requestPermission()
    setStatus(perm === 'granted' ? 'granted' : 'denied')
    if (perm === 'granted') {
      new Notification('STYLOGESTOR', {
        body: 'Notificações ativadas! Você será avisado sobre novos agendamentos.',
        icon: '/favicon.ico',
      })
    }
  }

  if (status === 'granted' || status === 'unsupported') return null

  return (
    <div className="fixed bottom-20 right-5 z-40 bg-[#1A3A6B] text-white rounded-2xl shadow-xl p-4 max-w-xs">
      <p className="font-sora font-bold text-sm mb-1">🔔 Ativar notificações</p>
      <p className="text-white/70 text-xs mb-3">Receba alertas de novos agendamentos em tempo real.</p>
      <div className="flex gap-2">
        <button
          onClick={requestPermission}
          className="flex-1 bg-[#F5A623] text-[#1A3A6B] text-xs font-bold py-2 rounded-xl hover:bg-[#e09610] transition-colors"
        >
          Ativar
        </button>
        <button
          onClick={() => setStatus('denied')}
          className="text-white/50 text-xs px-2 hover:text-white transition-colors"
        >
          Não agora
        </button>
      </div>
    </div>
  )
}

export function sendPushNotification(title: string, body: string) {
  if (typeof window !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  }
}
