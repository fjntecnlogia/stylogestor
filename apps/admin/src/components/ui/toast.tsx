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
  info:    '💬',
}

// Tema dark — combina com #0F172A do admin. Borda colorida pra identificar tipo.
const STYLES: Record<ToastType, string> = {
  success: 'bg-[#1C2333] border-l-4 border-[#10B981] text-white shadow-emerald-500/20',
  error:   'bg-[#1C2333] border-l-4 border-[#EF4444] text-white shadow-red-500/20',
  warning: 'bg-[#1C2333] border-l-4 border-[#F5A623] text-white shadow-amber-500/20',
  info:    'bg-[#1C2333] border-l-4 border-[#3B82F6] text-white shadow-blue-500/20',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 4000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 pl-4 pr-3 py-3.5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-sm max-w-md w-full ${STYLES[toast.type]}`}
      style={{
        animation: 'sg-toast-in 240ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span className="text-lg shrink-0 mt-0.5">{ICONS[toast.type]}</span>
      <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Fechar"
        className="text-white/40 hover:text-white text-lg leading-none shrink-0 mt-0.5 transition-colors"
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

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2)
    // Mantém só os últimos 4 visíveis pra não empilhar muito
    setToasts((prev) => [...prev.slice(-3), { id, message, type, duration }])
  }, [])

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast])
  const error   = useCallback((msg: string) => toast(msg, 'error'),   [toast])
  const warning = useCallback((msg: string) => toast(msg, 'warning'), [toast])
  const info    = useCallback((msg: string) => toast(msg, 'info'),    [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Keyframe inline pra evitar config no globals.css */}
      <style>{`
        @keyframes sg-toast-in {
          from { opacity: 0; transform: translateY(8px) translateX(20px); }
          to   { opacity: 1; transform: translateY(0) translateX(0); }
        }
      `}</style>
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
