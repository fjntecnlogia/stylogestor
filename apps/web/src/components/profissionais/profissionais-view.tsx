'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/toast'
import { useTenantPersistedState } from '@/lib/tenant-storage'
import { getInitialProfessionals, type ProfessionalFixture } from './__fixtures__/professionals'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

interface NovoProfForm { name: string; role: string; phone: string; commission: number; email: string }

export function ProfissionaisView() {
  // Storage local mantido como cache offline + retrocompat com mocks de dev.
  // Em prod a fonte de verdade é GET /api/professionals (que lê do banco).
  // O useEffect abaixo sincroniza: ao montar, busca do banco e sobrescreve
  // o state local — resolve o bug "criei o profissional no onboarding e
  // não aparece em /profissionais" (era diferença de slug/timing).
  const [professionals, setProfessionals] = useTenantPersistedState<ProfessionalFixture[]>(
    'professionals',
    getInitialProfessionals(),
  )
  const [selected, setSelected] = useState<ProfessionalFixture | null>(professionals[0] ?? null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<NovoProfForm>({ name: '', role: 'Barbeiro', phone: '', commission: 40, email: '' })
  const [editForm, setEditForm] = useState({ name: '', role: '', phone: '', commission: 0 })
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { success, error } = useToast()

  // Hidrata do banco no mount (fonte de verdade)
  useEffect(() => {
    let cancelled = false
    fetch('/api/professionals')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: ProfessionalFixture[]) => {
        if (cancelled) return
        if (Array.isArray(data)) {
          setProfessionals(data)
          setSelected((prev) => (prev ? (data.find((p) => p.id === prev.id) ?? data[0] ?? null) : data[0] ?? null))
        }
      })
      .catch((err) => {
        // Falha silenciosa — segue usando o cache do localStorage.
        // Em prod sem dados ainda, fica com [] mesmo (empty state aparece).
        console.warn('[profissionais] fetch falhou, usando cache local', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só roda no mount
  }, [])

  // Chama /api/professionals/invite pra criar usuário Clerk + enviar email convite
  const sendInvite = async (profId: string, profName: string, email: string, phone: string) => {
    setInvitingId(profId)
    try {
      const res = await fetch('/api/professionals/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profName, email, phone, professionalId: profId }),
      })
      const data = await res.json()
      if (!res.ok) {
        error(data.error || 'Erro ao enviar convite')
        return
      }
      success(`Convite enviado para ${email} 📧`)
    } catch {
      error('Erro de conexão. Tente novamente.')
    } finally {
      setInvitingId(null)
    }
  }

  const handleAdd = async () => {
    if (!form.name.trim() || !form.phone.trim()) return
    try {
      // Cria no banco — fonte de verdade
      const res = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          phone: form.phone,
          commission: form.commission,
        }),
      })
      const novo = await res.json()
      if (!res.ok) {
        error(novo.error || 'Erro ao cadastrar profissional')
        return
      }
      setProfessionals((p) => [...p, novo])
      setSelected(novo)
      setAdding(false)
      success(`Profissional ${novo.name} cadastrado!`)

      // Se foi informado email, dispara convite Clerk (cria login pro barbeiro acessar /profissional)
      const emailToInvite = form.email.trim()
      setForm({ name: '', role: 'Barbeiro', phone: '', commission: 40, email: '' })
      if (emailToInvite) {
        await sendInvite(novo.id, novo.name, emailToInvite, novo.phone)
      }
    } catch (err) {
      error('Erro de conexão ao cadastrar profissional')
      console.error(err)
    }
  }

  const handleEdit = async () => {
    if (!selected) return
    try {
      const res = await fetch(`/api/professionals/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name || selected.name,
          role: editForm.role || selected.role,
          phone: editForm.phone || selected.phone,
          commission: editForm.commission || selected.commission,
        }),
      })
      const updated = await res.json()
      if (!res.ok) {
        error(updated.error || 'Erro ao salvar alterações')
        return
      }
      setProfessionals((p) => p.map((x) => (x.id === selected.id ? { ...x, ...updated } : x)))
      setSelected((prev) => (prev ? { ...prev, ...updated } : prev))
      setEditing(false)
      success('Profissional atualizado!')
    } catch (err) {
      error('Erro de conexão ao salvar')
      console.error(err)
    }
  }

  // Form de novo profissional — JSX como variável (NÃO componente nested,
  // pra evitar remontagem a cada keystroke que mata o foco do input).
  // Reusado tanto no empty state (sem profissionais ainda) quanto na barra
  // lateral (já tem profissionais).
  const novoProfFormJsx = (
    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 space-y-3">
      <p className="font-semibold text-[#1A3A6B] text-sm">Novo profissional</p>
      <input placeholder="Nome completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
      <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
        className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
        {['Barbeiro','Cabeleireiro','Manicure','Esteticista','Outros'].map(r => <option key={r}>{r}</option>)}
      </select>
      <input placeholder="Telefone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
      <div>
        <label className="text-xs text-[#4A4A5A]">Comissão: {form.commission}%</label>
        <input type="range" min="10" max="70" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: Number(e.target.value) }))} className="w-full" />
      </div>

      {/* Email — opcional. Se preenchido, dispara convite Clerk pro barbeiro acessar /profissional */}
      <div className="pt-2 border-t border-[#BFDBFE]">
        <label className="text-xs font-semibold text-[#1A3A6B] block mb-1">
          Email (opcional — envia acesso ao painel)
        </label>
        <input type="email" placeholder="barbeiro@email.com" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
        <p className="text-[10px] text-[#6B7280] mt-1">
          Se preencher, o profissional recebe convite por email pra criar senha e acessar a agenda dele.
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={handleAdd} disabled={invitingId !== null || !form.name.trim() || !form.phone.trim()}
          className="flex-1 bg-[#1A3A6B] disabled:opacity-50 text-white text-sm font-bold py-2 rounded-xl hover:bg-[#142d55]">
          {invitingId ? 'Enviando convite...' : 'Salvar'}
        </button>
        <button onClick={() => setAdding(false)} className="flex-1 border border-[#E8E6E2] text-[#4A4A5A] text-sm py-2 rounded-xl hover:bg-[#F8F6F2]">Cancelar</button>
      </div>
    </div>
  )

  // Empty state quando NEXT_PUBLIC_USE_MOCKS=false e nenhum profissional
  // foi cadastrado ainda. Renderiza o form inline se adding=true (sem
  // isso o botão do empty state mudava o state mas o form nunca aparecia
  // porque ficava dentro do return principal).
  if (!selected) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        {adding ? novoProfFormJsx : (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-12 text-center">
            <p className="text-5xl mb-3">✂️</p>
            <p className="font-sora font-bold text-[#111827] text-lg">Nenhum profissional cadastrado</p>
            <p className="text-sm text-[#6B7280] mt-1 mb-4">Cadastre o primeiro profissional pra começar a usar a agenda.</p>
            <button onClick={() => setAdding(true)}
              className="bg-[#1A3A6B] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#142d55] text-sm">
              + Novo profissional
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista */}
      <div className="space-y-3">
        <button onClick={() => { setAdding(true); setEditing(false) }}
          className="w-full bg-[#1A3A6B] text-white font-semibold py-2.5 rounded-xl hover:bg-[#142d55] transition-colors text-sm">
          + Novo profissional
        </button>

        {/* Form de adicionar */}
        {adding && novoProfFormJsx}

        {professionals.map((p) => (
          <button key={p.id} onClick={() => { setSelected(p); setEditing(false); setAdding(false) }}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${selected.id === p.id ? 'border-[#1A3A6B] bg-[#1A3A6B]/5' : 'bg-white border-[#E8E6E2] hover:border-[#1A3A6B]/40'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white font-bold text-lg shrink-0">{p.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1C1C2E] truncate">{p.name}</p>
                <p className="text-xs text-[#4A4A5A]">{p.role} · {p.commission}% comissão</p>
              </div>
              <span className={`w-2 h-2 rounded-full ${p.active ? 'bg-[#1B8A5A]' : 'bg-[#4A4A5A]'}`}></span>
            </div>
          </button>
        ))}
      </div>

      {/* Detalhe */}
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Atendimentos/mês', value: selected.stats.month, color: '#1A3A6B' },
            { label: 'Faturado/mês',     value: `R$ ${selected.stats.revenue}`, color: '#1B8A5A' },
            { label: 'Comissão/mês',     value: `R$ ${selected.stats.commission}`, color: '#F5A623' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-[#E8E6E2] text-center">
              <p className="font-sora font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-[#4A4A5A] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E6E2] p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-sora font-bold text-[#1C1C2E]">{selected.name}</h3>
            <button
              onClick={() => { setEditing(e => !e); setEditForm({ name: selected.name, role: selected.role, phone: selected.phone, commission: selected.commission }) }}
              className="text-xs text-[#1A3A6B] border border-[#1A3A6B]/30 px-3 py-1 rounded-lg hover:bg-[#1A3A6B]/5">
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {editing ? (
            <div className="space-y-3">
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome"
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
              <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="Telefone"
                className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
              <div>
                <label className="text-xs text-[#4A4A5A]">Comissão: {editForm.commission}%</label>
                <input type="range" min="10" max="70" value={editForm.commission} onChange={e => setEditForm(f => ({ ...f, commission: Number(e.target.value) }))} className="w-full" />
              </div>
              <button onClick={handleEdit} className="w-full bg-[#1A3A6B] text-white font-bold py-2.5 rounded-xl hover:bg-[#142d55]">
                Salvar alterações
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-[#4A4A5A]">Função</p><p className="font-medium">{selected.role}</p></div>
                <div><p className="text-xs text-[#4A4A5A]">Telefone</p><p className="font-medium">{selected.phone}</p></div>
                <div><p className="text-xs text-[#4A4A5A]">Comissão</p><p className="font-medium text-[#F5A623]">{selected.commission}%</p></div>
                <div><p className="text-xs text-[#4A4A5A]">Status</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selected.active ? 'bg-[#1B8A5A]/10 text-[#1B8A5A]' : 'bg-[#4A4A5A]/10 text-[#4A4A5A]'}`}>
                    {selected.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              {/* Convidar pra ter acesso ao painel /profissional */}
              <InviteAccessBox
                onInvite={(email) => sendInvite(selected.id, selected.name, email, selected.phone)}
                loading={invitingId === selected.id}
              />
            </>
          )}

          <div>
            <p className="text-xs font-semibold text-[#4A4A5A] uppercase tracking-wide mb-3">Horários de trabalho</p>
            <div className="space-y-2">
              {DIAS.map((dia, i) => {
                const sched = selected.schedules.find((s) => s.day === i)
                return (
                  <div key={dia} className="flex items-center justify-between py-1.5 border-b border-[#E8E6E2] last:border-0">
                    <span className="text-sm font-medium text-[#1C1C2E] w-10">{dia}</span>
                    {sched ? <span className="text-sm text-[#4A4A5A]">{sched.start} — {sched.end}</span> : <span className="text-sm text-[#4A4A5A]/40">Folga</span>}
                    <div className={`w-2 h-2 rounded-full ${sched ? 'bg-[#1B8A5A]' : 'bg-[#E8E6E2]'}`}></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Caixa para o gestor enviar (ou re-enviar) o convite de acesso ao painel
 * /profissional pro barbeiro que já está cadastrado.
 */
function InviteAccessBox({ onInvite, loading }: { onInvite: (email: string) => void; loading: boolean }) {
  const [email, setEmail] = useState('')
  const [expanded, setExpanded] = useState(false)

  if (!expanded) {
    return (
      <div className="pt-3 border-t border-[#E8E6E2]">
        <button
          onClick={() => setExpanded(true)}
          className="text-sm font-semibold text-[#1A3A6B] hover:underline flex items-center gap-2"
        >
          🔑 Enviar acesso ao painel do profissional
        </button>
      </div>
    )
  }

  return (
    <div className="pt-3 border-t border-[#E8E6E2] space-y-2">
      <p className="text-xs font-semibold text-[#1A3A6B]">Convite ao painel /profissional</p>
      <input
        type="email"
        placeholder="email-do-profissional@exemplo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border border-[#E8E6E2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
      />
      <p className="text-[10px] text-[#6B7280]">
        Vai receber um email com link pra criar senha e acessar a agenda dele em app.stylogestor.com.br
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!email.includes('@')) return
            onInvite(email)
            setEmail('')
            setExpanded(false)
          }}
          disabled={loading || !email.includes('@')}
          className="flex-1 bg-[#1A3A6B] disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl hover:bg-[#142d55]"
        >
          {loading ? 'Enviando...' : '📧 Enviar convite'}
        </button>
        <button
          onClick={() => { setExpanded(false); setEmail('') }}
          className="px-3 border border-[#E8E6E2] text-[#4A4A5A] text-xs py-2 rounded-xl hover:bg-[#F8F6F2]"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
