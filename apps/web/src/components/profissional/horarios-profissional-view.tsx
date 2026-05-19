'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/components/ui/toast'
import { useTenantPersistedState } from '@/lib/tenant-storage'
import { getInitialProfessionals, type ProfessionalFixture } from '../../components/profissionais/__fixtures__/professionals'
import { MissingProfile } from './missing-profile'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

interface Bloqueio {
  id: string
  professionalId: string
  date: string         // YYYY-MM-DD
  type: 'full_day' | 'interval'
  startTime?: string   // HH:mm — só se type=interval
  endTime?: string     // HH:mm — só se type=interval
  reason: string
  createdAt: string
}

export function HorariosProfissionalView() {
  const { user } = useUser()
  const professionalId = (user?.publicMetadata as { professionalId?: string } | undefined)?.professionalId ?? '1'

  // Encontra o profissional logado na lista compartilhada com /profissionais
  const [allProfessionals] = useTenantPersistedState<ProfessionalFixture[]>(
    'professionals',
    getInitialProfessionals(),
  )
  const me = allProfessionals.find((p) => p.id === professionalId) ?? allProfessionals[0]

  // Bloqueios persistidos por tenant
  const [bloqueios, setBloqueios] = useTenantPersistedState<Bloqueio[]>(
    'profissional:bloqueios',
    [],
  )

  // Estado do form de novo bloqueio
  const [adding, setAdding] = useState(false)
  const [novoBloqueio, setNovoBloqueio] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'full_day' as 'full_day' | 'interval',
    startTime: '12:00',
    endTime: '13:00',
    reason: '',
  })

  const { success, info } = useToast()

  // Bloqueios deste profissional, ordenados por data
  const meusBloqueios = bloqueios
    .filter((b) => b.professionalId === professionalId)
    .sort((a, b) => a.date.localeCompare(b.date))

  // Datas próximas com bloqueio (próximos 30 dias)
  const hoje = format(new Date(), 'yyyy-MM-dd')
  const proximosBloqueios = meusBloqueios.filter((b) => b.date >= hoje)
  const passados = meusBloqueios.filter((b) => b.date < hoje).slice(0, 3) // mostra só 3

  const handleAdicionar = () => {
    if (!novoBloqueio.reason.trim()) {
      info('Informe o motivo do bloqueio')
      return
    }
    const novo: Bloqueio = {
      id: `bl-${Date.now()}`,
      professionalId,
      date: novoBloqueio.date,
      type: novoBloqueio.type,
      reason: novoBloqueio.reason.trim(),
      createdAt: new Date().toISOString(),
      ...(novoBloqueio.type === 'interval'
        ? { startTime: novoBloqueio.startTime, endTime: novoBloqueio.endTime }
        : {}),
    }
    setBloqueios((p) => [...p, novo])
    success('Bloqueio adicionado ✅')
    setAdding(false)
    setNovoBloqueio({
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'full_day',
      startTime: '12:00',
      endTime: '13:00',
      reason: '',
    })
  }

  const handleRemover = (id: string) => {
    if (!confirm('Remover este bloqueio?')) return
    setBloqueios((p) => p.filter((b) => b.id !== id))
    success('Bloqueio removido')
  }

  const formatBloqueioDate = (date: string) => {
    const d = new Date(date + 'T00:00:00')
    return format(d, "EEEE, d 'de' MMMM", { locale: ptBR })
  }

  // Sem perfil ainda → empty state (evita crash em SSR/prerender com USE_MOCKS=false)
  if (!me) return <MissingProfile titulo="Meus Horários" />

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-sora font-extrabold text-2xl text-[#1C1C2E]">Meus Horários</h1>
        <p className="text-sm text-[#6B7280]">
          Horário padrão de trabalho + bloqueios pontuais (folga, almoço, intervalo)
        </p>
      </div>

      {/* Horário padrão de trabalho */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-sora font-bold text-[#111827]">🗓️ Horário padrão semanal</h2>
          <span className="text-[10px] text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full font-semibold">
            Definido pelo gestor
          </span>
        </div>
        <div className="space-y-1.5">
          {DIAS.map((dia, i) => {
            const sched = me.schedules.find((s) => s.day === i)
            return (
              <div key={dia} className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6] last:border-0">
                <span className="text-sm font-medium text-[#1C1C2E] w-12">{dia}</span>
                {sched ? (
                  <span className="text-sm text-[#374151]">{sched.start} — {sched.end}</span>
                ) : (
                  <span className="text-xs text-[#9CA3AF]">Folga</span>
                )}
                <div className={`w-2 h-2 rounded-full ${sched ? 'bg-[#1B8A5A]' : 'bg-[#E5E7EB]'}`} />
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-[#9CA3AF] mt-3">
          💡 Pra alterar o horário padrão semanal, fale com o gestor da barbearia.
        </p>
      </div>

      {/* Adicionar bloqueio */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-sora font-bold text-[#111827]">🚫 Bloqueios pontuais</h2>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="bg-[#1A3A6B] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#142d55]"
            >
              + Bloquear horário
            </button>
          )}
        </div>

        {adding && (
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 space-y-3 mb-4">
            <p className="text-sm font-semibold text-[#1A3A6B]">Novo bloqueio</p>

            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1">Data</label>
              <input
                type="date"
                value={novoBloqueio.date}
                min={hoje}
                max={format(addDays(new Date(), 180), 'yyyy-MM-dd')}
                onChange={(e) => setNovoBloqueio((b) => ({ ...b, date: e.target.value }))}
                className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {(['full_day', 'interval'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNovoBloqueio((b) => ({ ...b, type: t }))}
                    className={`py-2 rounded-xl border text-sm font-semibold transition-all ${
                      novoBloqueio.type === t
                        ? 'border-[#1A3A6B] bg-[#1A3A6B] text-white'
                        : 'border-[#E5E7EB] text-[#374151] hover:border-[#1A3A6B]/40'
                    }`}
                  >
                    {t === 'full_day' ? '🛌 Dia inteiro' : '⏰ Intervalo'}
                  </button>
                ))}
              </div>
            </div>

            {novoBloqueio.type === 'interval' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1">De</label>
                  <input
                    type="time"
                    value={novoBloqueio.startTime}
                    onChange={(e) => setNovoBloqueio((b) => ({ ...b, startTime: e.target.value }))}
                    className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1">Até</label>
                  <input
                    type="time"
                    value={novoBloqueio.endTime}
                    onChange={(e) => setNovoBloqueio((b) => ({ ...b, endTime: e.target.value }))}
                    className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1">Motivo *</label>
              <input
                type="text"
                placeholder="Ex: Folga · Almoço · Consulta médica · Reunião"
                value={novoBloqueio.reason}
                onChange={(e) => setNovoBloqueio((b) => ({ ...b, reason: e.target.value }))}
                className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAdicionar}
                disabled={!novoBloqueio.reason.trim()}
                className="flex-1 bg-[#1A3A6B] disabled:opacity-40 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-[#142d55]"
              >
                ✓ Adicionar
              </button>
              <button
                onClick={() => setAdding(false)}
                className="flex-1 border border-[#E5E7EB] text-[#374151] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#F8F6F2]"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de bloqueios futuros */}
        {proximosBloqueios.length === 0 ? (
          <div className="text-center py-6 text-[#6B7280]">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm font-semibold">Nenhum bloqueio próximo</p>
            <p className="text-xs mt-1">Adicione folgas, almoço ou intervalos pra que o sistema não agende neles.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Próximos</p>
            {proximosBloqueios.map((b) => (
              <div key={b.id} className="flex items-start gap-3 p-3 bg-[#FFF7ED] border border-[#FED7AA] rounded-xl">
                <span className="text-2xl">{b.type === 'full_day' ? '🛌' : '⏰'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#92400E] text-sm capitalize">{formatBloqueioDate(b.date)}</p>
                  <p className="text-xs text-[#92400E] mt-0.5">
                    {b.type === 'full_day' ? 'Dia inteiro' : `${b.startTime} — ${b.endTime}`}
                    {' · '}
                    {b.reason}
                  </p>
                </div>
                <button
                  onClick={() => handleRemover(b.id)}
                  className="text-xs text-red-500 font-bold px-2 py-1 rounded-lg hover:bg-red-50 shrink-0"
                  aria-label="Remover bloqueio"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Histórico (passados) */}
        {passados.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Últimos passados</p>
            <div className="space-y-1">
              {passados.map((b) => (
                <div key={b.id} className="text-xs text-[#9CA3AF] flex justify-between py-1">
                  <span className="capitalize">{formatBloqueioDate(b.date)}</span>
                  <span>{b.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nota futura */}
      <div className="bg-[#F0F4FF] border border-[#BFDBFE] rounded-2xl p-4 text-xs text-[#1E40AF]">
        💡 <strong>Como funciona:</strong> os bloqueios que você adicionar aqui aparecem na agenda
        e impedem que o booking público marque clientes nesses horários. Quando o backend de
        disponibilidade estiver plugado, isso vai sincronizar automaticamente.
      </div>
    </div>
  )
}
