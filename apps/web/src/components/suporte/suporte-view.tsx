'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/toast'

const TIPOS = [
  { id: 'suporte',    label: 'Suporte técnico', icon: '🎧', desc: 'Algo não está funcionando como esperado', color: '#3B82F6' },
  { id: 'elogio',     label: 'Elogio',          icon: '⭐', desc: 'Quero compartilhar uma experiência positiva', color: '#10B981' },
  { id: 'reclamacao', label: 'Reclamação',       icon: '⚠️', desc: 'Não fiquei satisfeito com algo', color: '#EF4444' },
  { id: 'sugestao',   label: 'Sugestão',         icon: '💡', desc: 'Tenho uma ideia para melhorar o sistema', color: '#F59E0B' },
]

const MOCK_TICKETS = [
  { id: '1', tipo: 'suporte',    titulo: 'WhatsApp não enviando',        status: 'resolvido',   data: '08/05/2026', resposta: 'Problema identificado e corrigido! A Evolution API foi reiniciada.' },
  { id: '2', tipo: 'sugestao',   titulo: 'Relatório semanal por email',  status: 'andamento',   data: '05/05/2026', resposta: '' },
  { id: '3', tipo: 'elogio',     titulo: 'Sistema incrível!',            status: 'resolvido',   data: '01/05/2026', resposta: 'Obrigado pelo elogio! Ficamos felizes em ajudar. 😊' },
]

const STATUS_CONFIG = {
  aberto:    { label: 'Aguardando',    cls: 'bg-[#FEF9C3] text-[#92400E]',  dot: 'bg-[#F59E0B]' },
  andamento: { label: 'Em andamento',  cls: 'bg-[#DBEAFE] text-[#1E40AF]',  dot: 'bg-[#3B82F6]' },
  resolvido: { label: 'Resolvido',     cls: 'bg-[#D1FAE5] text-[#065F46]',  dot: 'bg-[#10B981]' },
}

export function SuporteView() {
  const [tab, setTab] = useState<'novo' | 'historico'>('historico')
  const [tipo, setTipo] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prioridade, setPrioridade] = useState('media')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState(MOCK_TICKETS)
  const { success } = useToast()

  const handleEnviar = async () => {
    if (!tipo || !titulo || !descricao) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))

    const novoTicket = {
      id: String(tickets.length + 1),
      tipo,
      titulo,
      status: 'aberto',
      data: new Date().toLocaleDateString('pt-BR'),
      resposta: '',
    }
    setTickets((prev) => [novoTicket, ...prev])
    setEnviado(true)
    setLoading(false)
    success('Chamado enviado! Nossa equipe responderá em breve.')
    setTimeout(() => {
      setEnviado(false)
      setTab('historico')
      setTipo('')
      setTitulo('')
      setDescricao('')
    }, 2000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Tabs */}
      <div className="flex bg-white border border-[#E5E7EB] rounded-xl p-1 w-fit shadow-sm">
        <button onClick={() => setTab('historico')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'historico' ? 'bg-[#1A3A6B] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}>
          📋 Meus chamados ({tickets.length})
        </button>
        <button onClick={() => setTab('novo')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'novo' ? 'bg-[#1A3A6B] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}>
          + Abrir chamado
        </button>
      </div>

      {/* NOVO CHAMADO */}
      {tab === 'novo' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="bg-[#1A3A6B] px-6 py-4">
            <h2 className="font-sora font-bold text-white text-lg">Novo chamado</h2>
            <p className="text-white/60 text-sm mt-0.5">Preencha as informações abaixo. Respondemos em até 2 horas úteis.</p>
          </div>

          {enviado ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="font-sora font-bold text-xl text-[#111827]">Chamado enviado!</h3>
              <p className="text-[#6B7280] text-sm mt-1">Nossa equipe responderá em breve.</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Tipo */}
              <div>
                <label className="text-sm font-bold text-[#111827] block mb-3">Tipo de chamado *</label>
                <div className="grid grid-cols-2 gap-3">
                  {TIPOS.map((t) => (
                    <button key={t.id} onClick={() => setTipo(t.id)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        tipo === t.id ? 'border-[#1A3A6B] bg-[#EFF6FF]' : 'border-[#E5E7EB] hover:border-[#1A3A6B]/30 bg-white'
                      }`}>
                      <span className="text-2xl shrink-0">{t.icon}</span>
                      <div>
                        <p className="font-bold text-sm text-[#111827]">{t.label}</p>
                        <p className="text-xs text-[#6B7280] mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prioridade */}
              <div>
                <label className="text-sm font-bold text-[#111827] block mb-2">Prioridade</label>
                <div className="flex gap-2">
                  {[
                    { id: 'baixa',  label: 'Baixa',  color: 'bg-[#D1FAE5] text-[#065F46]' },
                    { id: 'media',  label: 'Média',  color: 'bg-[#FEF9C3] text-[#92400E]' },
                    { id: 'alta',   label: 'Alta',   color: 'bg-[#FEE2E2] text-[#991B1B]' },
                  ].map((p) => (
                    <button key={p.id} onClick={() => setPrioridade(p.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                        prioridade === p.id ? `${p.color} border-current` : 'border-[#E5E7EB] text-[#6B7280]'
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="text-sm font-bold text-[#111827] block mb-1.5">Assunto *</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Resumo do seu chamado em uma linha"
                  className="w-full border border-[#D1D5DB] rounded-xl px-4 py-3 text-sm text-[#111827] font-medium placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="text-sm font-bold text-[#111827] block mb-1.5">Descrição detalhada *</label>
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva com detalhes o que aconteceu, o que você estava fazendo, e como podemos ajudar..."
                  rows={5}
                  className="w-full border border-[#D1D5DB] rounded-xl px-4 py-3 text-sm text-[#111827] font-medium placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] resize-none"
                />
              </div>

              {/* Botão */}
              <button onClick={handleEnviar}
                disabled={!tipo || !titulo || !descricao || loading}
                className="w-full bg-[#1A3A6B] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl hover:bg-[#142d55] transition-colors text-base shadow-sm flex items-center justify-center gap-2">
                {loading ? (
                  <><span className="animate-spin">⏳</span> Enviando...</>
                ) : (
                  '📤 Enviar chamado'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* HISTÓRICO */}
      {tab === 'historico' && (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center shadow-sm">
              <p className="text-4xl mb-3">🎉</p>
              <h3 className="font-sora font-bold text-lg text-[#111827]">Nenhum chamado aberto</h3>
              <p className="text-[#6B7280] text-sm mt-1">Tudo funcionando perfeitamente!</p>
              <button onClick={() => setTab('novo')}
                className="mt-4 bg-[#1A3A6B] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#142d55]">
                Abrir novo chamado
              </button>
            </div>
          ) : (
            tickets.map((t) => {
              const tipoConfig = TIPOS.find((tp) => tp.id === t.tipo)
              const st = STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG]
              return (
                <div key={t.id} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{tipoConfig?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-sora font-bold text-[#111827]">{t.titulo}</p>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${st.cls}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${st.dot} mr-1.5`}></span>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-0.5 font-medium">
                          {tipoConfig?.label} · Aberto em {t.data}
                        </p>
                      </div>
                    </div>

                    {/* Resposta da equipe */}
                    {t.resposta && (
                      <div className="mt-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4">
                        <p className="text-xs font-bold text-[#065F46] mb-1">✅ Resposta da equipe STYLOGESTOR</p>
                        <p className="text-sm text-[#065F46]">{t.resposta}</p>
                      </div>
                    )}

                    {!t.resposta && t.status !== 'resolvido' && (
                      <div className="mt-4 bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-4">
                        <p className="text-xs font-medium text-[#92400E]">⏳ Aguardando resposta da nossa equipe. Prazo: até 2h úteis.</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Info de contato */}
      <div className="bg-[#F0F4FF] border border-[#BFDBFE] rounded-2xl p-5">
        <h3 className="font-semibold text-[#1E40AF] mb-2">Outros canais de atendimento</h3>
        <div className="flex gap-4 flex-wrap">
          <a href="https://wa.me/5565996952828" target="_blank"
            className="flex items-center gap-2 text-sm text-[#1E40AF] font-semibold hover:underline">
            💬 WhatsApp: (65) 99696-52828
          </a>
          <a href="mailto:suporte@stylogestor.com.br"
            className="flex items-center gap-2 text-sm text-[#1E40AF] font-semibold hover:underline">
            📧 suporte@stylogestor.com.br
          </a>
        </div>
        <p className="text-xs text-[#6B7280] mt-2">Seg–Sex 08h–18h · Sab 08h–12h</p>
      </div>
    </div>
  )
}
