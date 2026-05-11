'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-[#ECFDF5] border-[#6EE7B7] text-[#065F46]',
  error:   'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]',
  warning: 'bg-[#FFFBEB] border-[#FCD34D] text-[#92400E]',
  info:    'bg-[#EFF6FF] border-[#93C5FD] text-[#1E40AF]',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 3500)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-lg max-w-sm w-full
      animate-in slide-in-from-right-5 fade-in duration-300 ${STYLES[toast.type]}`}
    >
      <span className="text-lg shrink-0">{ICONS[toast.type]}</span>
      <p className="text-sm font-semibold flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-current opacity-50 hover:opacity-100 text-lg leading-none shrink-0"
      >
        ×
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }])
  }, [])

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast])
  const error   = useCallback((msg: string) => toast(msg, 'error'),   [toast])
  const warning = useCallback((msg: string) => toast(msg, 'warning'), [toast])
  const info    = useCallback((msg: string) => toast(msg, 'info'),    [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
