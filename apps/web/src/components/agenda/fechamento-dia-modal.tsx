'use client'

import * as Dialog from '@radix-ui/react-dialog'

interface Appt {
  id: string; client: string; service: string; price: number
  discount: number; payMethod: string; status: string
  professionalId: string; start: string
}

interface Props {
  open: boolean
  onClose: () => void
  appointments: Appt[]
  totalDia: number
}

const PROFISSIONAIS: Record<string, string> = { '1': 'João Silva', '2': 'Pedro Costa' }
const COMISSAO: Record<string, number> = { '1': 40, '2': 35 }

export function FechamentoDiaModal({ open, onClose, appointments, totalDia }: Props) {
  const concluidos = appointments.filter((a) => a.status === 'COMPLETED')
  const cancelados = appointments.filter((a) => a.status === 'CANCELED')
  const noShow     = appointments.filter((a) => a.status === 'NO_SHOW')

  const porForma = {
    PIX:      concluidos.filter((a) => a.payMethod === 'PIX').reduce((s, a) => s + a.price - a.discount, 0),
    Dinheiro: concluidos.filter((a) => a.payMethod === 'Dinheiro').reduce((s, a) => s + a.price - a.discount, 0),
    Cartão:   concluidos.filter((a) => a.payMethod === 'Cartão').reduce((s, a) => s + a.price - a.discount, 0),
    Débito:   concluidos.filter((a) => a.payMethod === 'Débito').reduce((s, a) => s + a.price - a.discount, 0),
  }

  const totalDescontos = concluidos.reduce((s, a) => s + a.discount, 0)
  const totalBruto     = concluidos.reduce((s, a) => s + a.price, 0)

  // Comissão por profissional
  const porProfissional = Object.entries(PROFISSIONAIS).map(([id, name]) => {
    const appts = concluidos.filter((a) => a.professionalId === id)
    const faturado = appts.reduce((s, a) => s + a.price - a.discount, 0)
    const comissao = Math.round(faturado * (COMISSAO[id] / 100))
    return { id, name, atendimentos: appts.length, faturado, comissao, pct: COMISSAO[id] }
  })

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="bg-[#1A3A6B] px-6 py-4 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-white font-sora font-bold text-lg">
                💰 Fechamento do Dia
              </Dialog.Title>
              <p className="text-white/60 text-sm mt-0.5">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white text-xl">✕</button>
          </div>

          <div className="p-6 space-y-6">

            {/* Resumo geral */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Atendimentos', value: concluidos.length, sub: `${appointments.length} total`, color: '#1A3A6B' },
                { label: 'Faturamento bruto', value: `R$ ${totalBruto}`, sub: 'antes dos descontos', color: '#374151' },
                { label: 'Descontos dados', value: `-R$ ${totalDescontos}`, sub: `${concluidos.filter(a=>a.discount>0).length} com desconto`, color: '#DC2626' },
                { label: 'Total recebido', value: `R$ ${totalDia}`, sub: 'líquido do dia', color: '#1B8A5A' },
              ].map((k) => (
                <div key={k.label} className="bg-[#F9FAFB] rounded-xl p-3 border border-[#E5E7EB]">
                  <p className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wide">{k.label}</p>
                  <p className="font-sora font-bold text-lg mt-1" style={{ color: k.color }}>{k.value}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Formas de pagamento */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="bg-[#F9FAFB] px-4 py-2.5 border-b border-[#E5E7EB]">
                <p className="text-sm font-bold text-[#111827]">Formas de pagamento</p>
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                {Object.entries(porForma).map(([forma, valor]) => (
                  <div key={forma} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{forma === 'PIX' ? '🔷' : forma === 'Dinheiro' ? '💵' : forma === 'Cartão' ? '💳' : '💜'}</span>
                      <span className="text-sm font-medium text-[#374151]">{forma}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-[#E5E7EB] rounded-full h-1.5">
                        <div className="bg-[#1A3A6B] h-1.5 rounded-full"
                          style={{ width: totalDia > 0 ? `${(valor / totalDia) * 100}%` : '0%' }} />
                      </div>
                      <span className="text-sm font-bold text-[#111827] w-20 text-right">R$ {valor}</span>
                      <span className="text-xs text-[#9CA3AF] w-10 text-right">
                        {totalDia > 0 ? Math.round((valor / totalDia) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comissões por profissional */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="bg-[#F9FAFB] px-4 py-2.5 border-b border-[#E5E7EB]">
                <p className="text-sm font-bold text-[#111827]">Comissões do dia</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left px-4 py-2 text-xs text-[#6B7280] font-semibold">Profissional</th>
                    <th className="text-center px-3 py-2 text-xs text-[#6B7280] font-semibold">Atend.</th>
                    <th className="text-right px-3 py-2 text-xs text-[#6B7280] font-semibold">Faturado</th>
                    <th className="text-right px-3 py-2 text-xs text-[#6B7280] font-semibold">Comissão ({'{'}%{'}'})</th>
                    <th className="text-right px-4 py-2 text-xs text-[#6B7280] font-semibold">A pagar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {porProfissional.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-semibold text-[#111827]">{p.name}</td>
                      <td className="px-3 py-3 text-center text-[#374151]">{p.atendimentos}</td>
                      <td className="px-3 py-3 text-right text-[#374151]">R$ {p.faturado}</td>
                      <td className="px-3 py-3 text-right text-[#6B7280]">{p.pct}%</td>
                      <td className="px-4 py-3 text-right font-bold text-[#F5A623]">R$ {p.comissao}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#FEF9C3] font-bold">
                    <td className="px-4 py-2.5 text-[#111827]">Total comissões</td>
                    <td className="px-3 py-2.5 text-center text-[#111827]">{concluidos.length}</td>
                    <td className="px-3 py-2.5 text-right text-[#111827]">R$ {totalDia}</td>
                    <td className="px-3 py-2.5 text-right text-[#111827]">—</td>
                    <td className="px-4 py-2.5 text-right text-[#F5A623]">
                      R$ {porProfissional.reduce((s, p) => s + p.comissao, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Outros */}
            {(cancelados.length > 0 || noShow.length > 0) && (
              <div className="flex gap-3">
                {cancelados.length > 0 && (
                  <div className="flex-1 bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-[#DC2626]">{cancelados.length}</p>
                    <p className="text-xs text-[#9CA3AF] font-medium">Cancelamentos</p>
                  </div>
                )}
                {noShow.length > 0 && (
                  <div className="flex-1 bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-[#EA580C]">{noShow.length}</p>
                    <p className="text-xs text-[#9CA3AF] font-medium">Não compareceu</p>
                  </div>
                )}
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3">
              <button className="flex-1 bg-[#1A3A6B] text-white font-bold py-3 rounded-xl hover:bg-[#142d55] transition-colors">
                ✅ Confirmar fechamento
              </button>
              <button className="flex-1 border-2 border-[#E5E7EB] text-[#374151] font-semibold py-3 rounded-xl hover:bg-[#F9FAFB] transition-colors">
                📥 Exportar PDF
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
