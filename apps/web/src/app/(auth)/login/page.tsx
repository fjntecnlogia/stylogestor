'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { authErrorMessage } from '@/lib/auth-errors'
import { nestFetchWithRefresh } from '@/lib/nest-api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Preencha e-mail e senha.')
      return
    }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) {
      setError(authErrorMessage(error.message, 'Não foi possível entrar.'))
      setLoading(false)
      return
    }
    // Pós-login: sincroniza claims (role/subscriptionStatus/tenantSlug/
    // tenantName) no app_metadata — self-healing caso tenham mudado no
    // backend. nestFetchWithRefresh faz refreshSession depois, então o
    // cookie já vai atualizado pro full reload abaixo. Não bloqueia:
    // conta nova sem tenant cai no onboarding pelo middleware.
    try {
      await nestFetchWithRefresh('/tenants/me/sync-claims', { method: 'POST' })
    } catch {
      // segue mesmo assim — middleware tem fallback
    }
    // Full reload pra o middleware ler o cookie e rotear por role (gestor/barbeiro).
    window.location.assign('/dashboard')
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
          <p className="text-white/60 text-sm">Acesse sua conta para gerenciar seu negócio</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Senha</label>
            <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#1A3A6B] py-3 font-semibold text-white hover:bg-[#142d55] disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link href="/recuperar-senha" className="text-[#1A3A6B] font-medium hover:underline">
              Esqueci minha senha
            </Link>
            <Link href="/cadastro" className="text-[#1A3A6B] font-medium hover:underline">
              Criar conta
            </Link>
          </div>
        </form>

        <p className="text-center text-white/40 text-xs">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-[#F5A623] hover:underline font-medium">
            Teste grátis por 14 dias
          </Link>
        </p>
      </div>
    </div>
  )
}
