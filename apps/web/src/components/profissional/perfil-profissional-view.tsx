'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useToast } from '@/components/ui/toast'
import { useTenantPersistedState } from '@/lib/tenant-storage'
import { getInitialProfessionals } from '../../components/profissionais/__fixtures__/professionals'

interface PerfilEditavel {
  bio: string
  especialidades: string[]
  fotoUrl: string
  redeSocialInstagram: string
}

const ESPECIALIDADES_SUGESTOES = [
  'Corte masculino', 'Corte feminino', 'Barba', 'Pigmentação',
  'Hidratação', 'Coloração', 'Penteado', 'Sobrancelha',
  'Manicure', 'Pedicure', 'Depilação', 'Tratamento capilar',
]

export function PerfilProfissionalView() {
  const { user } = useUser()
  const professionalId = (user?.publicMetadata as { professionalId?: string } | undefined)?.professionalId ?? '1'

  // Dados base do profissional (vêm do gestor — só leitura aqui)
  const allProfessionals = getInitialProfessionals()
  const me = allProfessionals.find((p) => p.id === professionalId) ?? allProfessionals[0]

  // Perfil editável persistido por tenant (chave inclui o id do profissional pra não misturar)
  const [perfil, setPerfil] = useTenantPersistedState<PerfilEditavel>(
    `profissional:${professionalId}:perfil`,
    {
      bio: '',
      especialidades: [],
      fotoUrl: '',
      redeSocialInstagram: '',
    },
  )

  // Form de edição local (commit só ao Salvar)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<PerfilEditavel>(perfil)
  const [novaEspec, setNovaEspec] = useState('')

  const { success, info } = useToast()

  const startEdit = () => {
    setDraft(perfil)
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraft(perfil)
    setEditing(false)
  }

  const saveProfile = () => {
    setPerfil(draft)
    setEditing(false)
    success('Perfil atualizado ✅')
  }

  const addEspecialidade = (esp: string) => {
    const v = esp.trim()
    if (!v) return
    if (draft.especialidades.includes(v)) {
      info('Especialidade já adicionada')
      return
    }
    setDraft((d) => ({ ...d, especialidades: [...d.especialidades, v] }))
    setNovaEspec('')
  }

  const removeEspecialidade = (esp: string) => {
    setDraft((d) => ({ ...d, especialidades: d.especialidades.filter((e) => e !== esp) }))
  }

  // Sugestões disponíveis (que ainda não foram adicionadas)
  const sugestoesDisponiveis = ESPECIALIDADES_SUGESTOES.filter(
    (s) => !(editing ? draft : perfil).especialidades.includes(s),
  )

  const current = editing ? draft : perfil

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sora font-extrabold text-2xl text-[#1C1C2E]">Meu Perfil</h1>
          <p className="text-sm text-[#6B7280]">Atualize foto, bio e especialidades</p>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="bg-[#1A3A6B] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#142d55]"
          >
            ✏️ Editar
          </button>
        )}
      </div>

      {/* Card principal com foto + nome */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            {current.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.fotoUrl}
                alt={me.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#1A3A6B]"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white font-sora font-extrabold text-3xl">
                {me.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-sora font-bold text-xl text-[#111827] truncate">{me.name}</p>
            <p className="text-sm text-[#6B7280]">{me.role}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">{me.phone}</p>
          </div>
        </div>

        {editing && (
          <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
            <label className="text-xs font-semibold text-[#374151] block mb-1">URL da foto (link público)</label>
            <input
              type="url"
              placeholder="https://... (cole link de uma foto sua)"
              value={draft.fotoUrl}
              onChange={(e) => setDraft((d) => ({ ...d, fotoUrl: e.target.value }))}
              className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
            />
            <p className="text-[10px] text-[#9CA3AF] mt-1">
              Por enquanto cole um link público. Upload direto chega depois.
            </p>
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Sobre você</p>
        {editing ? (
          <textarea
            placeholder="Ex: Especialista em cortes modernos e barba. Atendo há 8 anos na região."
            rows={3}
            value={draft.bio}
            onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
            className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] resize-none"
          />
        ) : (
          <p className="text-sm text-[#374151]">
            {perfil.bio || <span className="text-[#9CA3AF] italic">Adicione uma descrição sobre você pra aparecer no booking público.</span>}
          </p>
        )}
      </div>

      {/* Especialidades */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Especialidades</p>

        {/* Chips das adicionadas */}
        {current.especialidades.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {current.especialidades.map((esp) => (
              <span
                key={esp}
                className="inline-flex items-center gap-1 bg-[#1A3A6B]/10 text-[#1A3A6B] text-xs font-semibold px-3 py-1.5 rounded-full"
              >
                {esp}
                {editing && (
                  <button
                    onClick={() => removeEspecialidade(esp)}
                    className="text-[#1A3A6B] hover:text-red-500 ml-1"
                    aria-label={`Remover ${esp}`}
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#9CA3AF] italic mb-3">Nenhuma especialidade adicionada ainda</p>
        )}

        {editing && (
          <>
            {/* Input pra customizada */}
            <div className="flex gap-2 mb-3">
              <input
                placeholder="Adicionar nova especialidade"
                value={novaEspec}
                onChange={(e) => setNovaEspec(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addEspecialidade(novaEspec)
                  }
                }}
                className="flex-1 border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
              />
              <button
                onClick={() => addEspecialidade(novaEspec)}
                disabled={!novaEspec.trim()}
                className="bg-[#1A3A6B] disabled:opacity-40 text-white text-sm font-bold px-4 rounded-xl hover:bg-[#142d55]"
              >
                +
              </button>
            </div>

            {/* Sugestões */}
            {sugestoesDisponiveis.length > 0 && (
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2 font-semibold">Sugestões</p>
                <div className="flex flex-wrap gap-2">
                  {sugestoesDisponiveis.map((esp) => (
                    <button
                      key={esp}
                      onClick={() => addEspecialidade(esp)}
                      className="bg-[#F8F6F2] text-[#374151] text-xs font-medium px-3 py-1.5 rounded-full hover:bg-[#1A3A6B]/10 hover:text-[#1A3A6B] transition-colors"
                    >
                      + {esp}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Redes sociais */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Instagram</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280] text-sm">@</span>
            <input
              type="text"
              placeholder="seu_instagram"
              value={draft.redeSocialInstagram}
              onChange={(e) => setDraft((d) => ({ ...d, redeSocialInstagram: e.target.value.replace('@', '') }))}
              className="flex-1 border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]"
            />
          </div>
        ) : (
          <p className="text-sm text-[#374151]">
            {perfil.redeSocialInstagram ? (
              <a
                href={`https://instagram.com/${perfil.redeSocialInstagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1A3A6B] hover:underline"
              >
                @{perfil.redeSocialInstagram}
              </a>
            ) : (
              <span className="text-[#9CA3AF] italic">Não informado</span>
            )}
          </p>
        )}
      </div>

      {/* Info do gestor (somente leitura) */}
      <div className="bg-[#F0F4FF] border border-[#BFDBFE] rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-[#1E40AF] uppercase tracking-wider">📋 Definido pelo gestor</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[#6B7280]">Comissão</p>
            <p className="font-bold text-[#F5A623]">{me.commission}%</p>
          </div>
          <div>
            <p className="text-[#6B7280]">Status</p>
            <p className="font-bold text-[#1B8A5A]">{me.active ? 'Ativo' : 'Inativo'}</p>
          </div>
        </div>
        <p className="text-[10px] text-[#6B7280]">
          Pra alterar nome, telefone, comissão ou status, fale com o gestor.
        </p>
      </div>

      {/* Save/Cancel (quando editando) */}
      {editing && (
        <div className="sticky bottom-20 lg:bottom-4 flex gap-2 bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-lg z-20">
          <button
            onClick={cancelEdit}
            className="flex-1 border border-[#E5E7EB] text-[#374151] font-semibold py-2.5 rounded-xl hover:bg-[#F8F6F2]"
          >
            Cancelar
          </button>
          <button
            onClick={saveProfile}
            className="flex-1 bg-[#1A3A6B] text-white font-bold py-2.5 rounded-xl hover:bg-[#142d55]"
          >
            ✓ Salvar alterações
          </button>
        </div>
      )}
    </div>
  )
}
