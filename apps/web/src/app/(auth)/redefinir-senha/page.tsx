'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { authErrorMessage } from '@/lib/auth-errors'

// Define a nova senha após o usuário clicar no link do e-mail de recuperação.
// O createBrowserClient (@supabase/ssr) troca o code da URL por sessão de
// recuperação automaticamente (detectSessionInUrl). Aí chamamos updateUser.
//
// ⚠️ Validar em staging contra o template "Reset Password" do Supabase
// (o link precisa apontar pra cá com o code/token corretos).
export default function RedefinirSenhaPage() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // Quando a sessão de recuperação é estabelecida, libera o form.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
    })
    // Fallback: checa se já há sessão (code já trocado).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Use no mínimo 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(authErrorMessage(error.message, 'Não foi possível redefinir a senha.'))
      return
    }
    setDone(true)
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
          <p className="text-white/60 text-sm">Defina sua nova senha</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
          {done ? (
            <div className="space-y-3 text-center">
              <p className="text-4xl">✅</p>
              <p className="font-semibold text-gray-900">Senha redefinida!</p>
              <Link
                href="/login"
                className="inline-block rounded-xl bg-[#1A3A6B] px-6 py-3 font-semibold text-white hover:bg-[#142d55]"
              >
                Entrar
              </Link>
            </div>
          ) : !ready ? (
            <p className="text-center text-sm text-gray-600 py-6">
              Validando o link de recuperação... Se você não veio pelo e-mail,{' '}
              <Link href="/recuperar-senha" className="text-[#1A3A6B] font-medium hover:underline">
                solicite um novo link
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nova senha</label>
                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="px-4 text-sm text-gray-500"
                  >
                    {showPassword ? 'ocultar' : 'mostrar'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar senha</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#1A3A6B]"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#1A3A6B] py-3 font-semibold text-white hover:bg-[#142d55] disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
