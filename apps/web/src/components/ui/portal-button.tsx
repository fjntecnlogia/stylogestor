'use client'

import { useState } from 'react'

interface Props {
  className?: string
  children?: React.ReactNode
}

export function PortalButton({ className, children }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Erro ao abrir portal')
      }
    } catch {
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {loading ? '⏳ Abrindo...' : (children ?? 'Portal do cliente →')}
    </button>
  )
}
