import { Suspense } from 'react'
import { PlanosView } from '@/components/planos/planos-view'

export const metadata = { title: 'Planos e Assinatura — STYLOGESTOR' }

export default function PlanosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#6B7280]">Carregando planos...</div>}>
      <PlanosView />
    </Suspense>
  )
}
