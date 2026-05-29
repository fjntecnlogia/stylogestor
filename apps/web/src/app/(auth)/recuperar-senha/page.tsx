'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { authErrorMessage } from '@/lib/auth-errors'

// Pede o link de redefinição de senha. ESSENCIAL no cutover: usuários migrados
// do Clerk não têm senha no Supabase — usam isto no 1º acesso.
export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      setError('Informe seu e-mail.')
      return
    }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setLoading(false)
    if (error) {
      setError(authErrorMessage(error.message, 'Não foi possível enviar o e-mail.'))
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#1A3A6B] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#F5A623] rounded-xl flex items-center justify-center font-sora font-extrabold text-[#1A3A6B] text-2xl">
              S
            </div>
            <span className="font-sora font-extrabold text-2xl text-white tracking-tight">
              STYLO<span className="text-[#F5A623]">GESTOR</span>
            </span>
          </div>
          <p className="text-white/60 text-sm">Recuperar acesso à sua conta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
          {sent ? (
            <div className="space-y-3 text-center">
              <p className="text-4xl">📧</p>
              <p className="font-semibold text-gray-900">Verifique seu e-mail</p>
              <p className="text-sm text-gray-600">
                Enviamos um link para <b>{email}</b> redefinir a senha. Confira a caixa de entrada e o spam.
              </p>
              <Link href="/login" className="inline-block text-[#1A3A6B] font-medium hover:underline">
                Voltar pro login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">
                Digite seu e-mail e enviaremos um link pra criar uma nova senha.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#1A3A6B]"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#1A3A6B] py-3 font-semibold text-white hover:bg-[#142d55] disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
              <Link href="/login" className="block text-center text-sm text-gray-500 hover:underline">
                Voltar pro login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
