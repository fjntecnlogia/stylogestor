'use client'

import { useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { format, subDays, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/components/ui/toast'
import { useTenantPersistedState } from '@/lib/tenant-storage'
import { getInitialAppointments, type AppointmentFixture } from '../agenda/__fixtures__/appointments'
import { getInitialProfessionals } from '../../components/profissionais/__fixtures__/professionals'

const METHOD_COLORS: Record<string, string> = {
  PIX:      '#1B8A5A',
  Dinheiro: '#F5A623',
  Cartão:   '#1A3A6B',
  Débito:   '#7C3AED',
}

export function FechamentoProfissionalView() {
  const { user } = useUser()
  const professionalId = (user?.publicMetadata as { professionalId?: string } | undefined)?.professionalId ?? '1'
  const { success } = useToast()

  // Dados do profissional logado (pra pegar a comissão configurada pelo gestor)
  const allProfessionals = getInitialProfessionals()
  const me = allProfessionals.find((p) => p.id === professionalId) ?? allProfessionals[0]

  // Date picker (futuro: ler agendamentos do dia selecionado quando endpoint real existir)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Agendamentos compartilhados com agenda
  const [allAppointments] = useTenantPersistedState<AppointmentFixture[]>(
    'agenda:appointments',
    getInitialAppointments(),
  )

  // Filtra agendamentos concluídos do barbeiro
  const concluidosDoDia = useMemo(
    () => allAppointments.filter((a) => a.professionalId === professionalId && a.status === 'COMPLETED'),
    [allAppointments, professionalId],
  )

  // Cálculos
  const totalBruto = concluidosDoDia.reduce((s, a) => s + a.price, 0)
  const totalDescontos = concluidosDoDia.reduce((s, a) => s + a.discount, 0)
  const totalLiquido = totalBruto - totalDescontos
  const minhaCommission = me.commission
  const valorComissao = Math.round((totalLiquido * minhaCommission) / 100)
  const ticketMedio = concluidosDoDia.length ? Math.round(totalLiquido / concluidosDoDia.length) : 0

  // Breakdown por forma de pagamento
  const porForma: Record<string, number> = {}
  concluidosDoDia.forEach((a) => {
    const m = a.payMethod || 'Outros'
    porForma[m] = (porForma[m] ?? 0) + (a.price - a.discount)
  })

  // Top serviços
  const porServico: Record<string, { count: number; total: number }> = {}
  concluidosDoDia.forEach((a) => {
    const key = a.service
    if (!porServico[key]) porServico[key] = { count: 0, total: 0 }
    porServico[key].count += 1
    porServico[key].total += a.price - a.discount
  })
  const topServicos = Object.entries(porServico)
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const dateStr = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })

  const handleExportarCSV = () => {
    const dataStr = format(selectedDate, 'yyyy-MM-dd')
    const linhas: string[] = []
    linhas.push(`STYLOGESTOR — Fechamento ${me.name}`)
    linhas.push(`Data;${dateStr}`)
    linhas.push('')
    linhas.push('Resumo')
    linhas.push(`Atendimentos concluídos;${concluidosDoDia.length}`)
    linhas.push(`Faturamento bruto;R$ ${totalBruto}`)
    linhas.push(`Descontos;R$ ${totalDescontos}`)
    linhas.push(`Faturamento líquido;R$ ${totalLiquido}`)
    linhas.push(`Comissão (${minhaCommission}%);R$ ${valorComissao}`)
    linhas.push(`Ticket médio;R$ ${ticketMedio}`)
    linhas.push('')
    linhas.push('Atendimentos')
    linhas.push('Horário;Cliente;Serviço;Pagamento;Valor;Desconto;Líquido')
    concluidosDoDia
      .sort((a, b) => a.start.localeCompare(b.start))
      .forEach((a) => {
        linhas.push(
          `${a.start};${a.client};${a.service};${a.payMethod || 'Pendente'};R$ ${a.price};R$ ${a.discount};R$ ${a.price - a.discount}`,
        )
      })

    const csv = '﻿' + linhas.join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fechamento-${me.name.toLowerCase().replace(/\s/g, '-')}-${dataStr}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    success('Fechamento exportado! 📥')
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-sora font-extrabold text-2xl text-[#1C1C2E]">Fechamento do Dia</h1>
        <p className="text-sm text-[#6B7280]">Resumo de faturamento e comissão</p>
      </div>

      {/* Navegação de data */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 flex items-center justify-between">
        <button
          onClick={() => setSelectedDate((d) => subDays(d, 1))}
          aria-label="Dia anterior"
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#E5E7EB] hover:bg-[#F8F6F2] text-[#374151] text-xl font-bold"
        >
          ‹
        </button>
        <div className="text-center flex-1">
          <p className="font-sora font-bold text-[#111827] capitalize text-base">{dateStr}</p>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-xs text-[#1A3A6B] font-semibold hover:underline mt-0.5"
          >
            Voltar pra hoje
          </button>
        </div>
        <button
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          aria-label="Próximo dia"
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#E5E7EB] hover:bg-[#F8F6F2] text-[#374151] text-xl font-bold"
        >
          ›
        </button>
      </div>

      {/* Card destaque comissão */}
      <div className="bg-gradient-to-r from-[#1A3A6B] to-[#1B8A5A] rounded-2xl p-5 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">Sua comissão hoje</p>
        <p className="font-sora font-extrabold text-4xl">R$ {valorComissao}</p>
        <p className="text-sm text-white/80 mt-1">
          {minhaCommission}% sobre R$ {totalLiquido} de faturamento líquido
        </p>
      </div>

      {/* Stats em grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Atendimentos', value: concluidosDoDia.length, sub: 'concluídos', color: '#1A3A6B' },
          { label: 'Faturamento bruto', value: `R$ ${totalBruto}`, sub: 'antes descontos', color: '#374151' },
          { label: 'Descontos dados', value: `-R$ ${totalDescontos}`, sub: 'concedidos', color: '#DC2626' },
          { label: 'Ticket médio', value: `R$ ${ticketMedio}`, sub: 'por atendimento', color: '#F5A623' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-[#E5E7EB] p-3 shadow-sm">
            <p className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider">{k.label}</p>
            <p className="font-sora font-extrabold text-xl mt-0.5" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-[#9CA3AF] font-medium mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Formas de pagamento */}
      {Object.keys(porForma).length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
          <p className="font-sora font-bold text-[#111827] mb-3">💳 Formas de pagamento</p>
          <div className="space-y-3">
            {Object.entries(porForma).map(([forma, valor]) => {
              const pct = totalLiquido > 0 ? Math.round((valor / totalLiquido) * 100) : 0
              const color = METHOD_COLORS[forma] || '#9CA3AF'
              return (
                <div key={forma}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-[#374151]">
                      {forma === 'PIX' ? '🔷' : forma === 'Dinheiro' ? '💵' : forma === 'Cartão' ? '💳' : '💰'}
                      {' '}{forma}
                    </span>
                    <span className="font-bold" style={{ color }}>R$ {valor} · {pct}%</span>
                  </div>
                  <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top serviços */}
      {topServicos.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
          <p className="font-sora font-bold text-[#111827] mb-3">⭐ Serviços mais feitos hoje</p>
          <div className="space-y-2">
            {topServicos.map((s, i) => (
              <div key={s.nome} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-[#9CA3AF] font-bold text-sm w-5">{i + 1}.</span>
                  <span className="text-sm font-medium text-[#374151]">{s.nome}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#1B8A5A]">R$ {s.total}</span>
                  <span className="text-[10px] text-[#9CA3AF] block">{s.count}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {concluidosDoDia.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center">
          <p className="text-5xl mb-3">📊</p>
          <p className="font-sora font-bold text-[#111827]">Nenhum atendimento concluído hoje</p>
          <p className="text-sm text-[#6B7280] mt-1">Quando você concluir atendimentos na agenda, o resumo aparece aqui.</p>
        </div>
      )}

      {/* Export */}
      {concluidosDoDia.length > 0 && (
        <button
          onClick={handleExportarCSV}
          className="w-full bg-[#1B8A5A] text-white font-bold py-3 rounded-xl hover:bg-[#156b47] transition-colors flex items-center justify-center gap-2"
        >
          📥 Exportar fechamento (CSV)
        </button>
      )}
    </div>
  )
}
