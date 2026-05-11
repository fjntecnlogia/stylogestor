import { SuporteView } from '@/components/suporte/suporte-view'

export const metadata = { title: 'Suporte — STYLOGESTOR' }

export default function SuportePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] font-sora">🎧 Suporte</h1>
        <p className="text-[#6B7280] text-sm mt-1 font-medium">
          Abra chamados, envie elogios ou reclamações. Nossa equipe responde em até 2h.
        </p>
      </div>
      <SuporteView />
    </div>
  )
}
