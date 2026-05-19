'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useTenantPersistedState } from '@/lib/tenant-storage'
import { getInitialClients, type ClientFixture } from '../clientes/__fixtures__/clients'
import { getInitialProducts, type ProductFixture } from '../estoque/__fixtures__/products'

interface Alert {
  id: string
  icon: string
  title: string
  desc: string
  action: string
  href: string
  color: string
  bg: string
  border: string
}

/**
 * Alertas derivados do storage real do tenant.
 * Em prod vazio: nenhum cliente cadastrado, nenhum alerta. Conforme o
 * gestor preenche dados, os alertas começam a aparecer.
 */
export function AlertsPanel() {
  const [clients] = useTenantPersistedState<ClientFixture[]>('clients', getInitialClients())
  const [products] = useTenantPersistedState<ProductFixture[]>('products', getInitialProducts())
  const [dismissed, setDismissed] = useState<string[]>([])

  const alerts = useMemo<Alert[]>(() => {
    const out: Alert[] = []

    // Clientes inativos (último visitou há +30 dias)
    const inativos = clients.filter((c) => c.segment === 'inativo')
    if (inativos.length > 0) {
      const names = inativos.slice(0, 3).map((c) => c.name.split(' ')[0]).join(', ')
      out.push({
        id: 'inativos',
        icon: '👻',
        title: `${inativos.length} ${inativos.length === 1 ? 'cliente sem visitar' : 'clientes sem visitar'} há +30 dias`,
        desc: `${names}${inativos.length > 3 ? ' e outros' : ''} não aparecem há tempo. Hora de um WhatsApp!`,
        action: 'Enviar mensagem',
        href: '/clientes?segment=inativo',
        color: '#F5A623',
        bg: '#FFF7ED',
        border: '#FED7AA',
      })
    }

    // Estoque baixo
    const estoqueBaixo = products.filter((p) => p.stock <= p.minStock)
    if (estoqueBaixo.length > 0) {
      const first = estoqueBaixo[0]
      out.push({
        id: 'estoque-baixo',
        icon: '📦',
        title: estoqueBaixo.length === 1
          ? `Estoque: ${first.name} baixo`
          : `${estoqueBaixo.length} produtos com estoque baixo`,
        desc: estoqueBaixo.length === 1
          ? `Restam ${first.stock} ${first.stock === 1 ? 'unidade' : 'unidades'}. Peça mais antes de acabar.`
          : `${first.name} e outros estão com estoque baixo.`,
        action: 'Ver estoque',
        href: '/estoque',
        color: '#1B8A5A',
        bg: '#ECFDF5',
        border: '#A7F3D0',
      })
    }

    return out
  }, [clients, products])

  const visible = alerts.filter((a) => !dismissed.includes(a.id))

  if (visible.length === 0) return null

  return (
    <div className="space-y-2">
      {visible.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 px-4 py-3 rounded-2xl border text-sm"
          style={{ background: a.bg, borderColor: a.border }}
        >
          <span className="text-xl shrink-0 mt-0.5">{a.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1C1C2E]">{a.title}</p>
            <p className="text-[#4A4A5A] text-xs mt-0.5">{a.desc}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={a.href}
              className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
              style={{ background: a.color }}
            >
              {a.action}
            </Link>
            <button
              onClick={() => setDismissed((p) => [...p, a.id])}
              aria-label="Dispensar alerta"
              className="text-[#9CA3AF] hover:text-[#4A4A5A] text-lg leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
