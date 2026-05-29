'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { authErrorMessage } from '@/lib/auth-errors'

// Cadastro em 2 passos (mesmo fluxo do mobile): cria conta → confirma com o
// código de 6 dígitos enviado por e-mail (reusa o template já configurado no
// Supabase). Após confirmar, segue pro onboarding.
export default function CadastroPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Preencha e-mail e senha.')
      return
    }
    if (password.length < 8) {
      setError('Use no mínimo 8 caracteres.')
      return
    }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)
    if (error) {
      setError(authErrorMessage(error.message, 'Não foi possível criar a conta.'))
      return
    }
    if (data.session) {
      // Confirmação de e-mail desligada → já logou.
      window.location.assign('/onboarding')
      return
    }
    setStep('verify')
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!code) {
      setError('Digite o código recebido por e-mail.')
      return
    }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'signup',
    })
    setLoading(false)
    if (error) {
      setError(authErrorMessage(error.message, 'Código inválido.'))
      return
    }
    if (data.session) {
      window.location.assign('/onboarding')
    } else {
      setError('Verificação incompleta. Tente novamente.')
    }
  }

  async function handleResend() {
    if (!email) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    })
    setLoading(false)
    setError(error ? authErrorMessage(error.message, 'Não foi possível reenviar.') : '')
    if (!error) alert(`Código reenviado para ${email}.`)
  }

  return (
    <div className="min-h-screen bg-[#1A3A6B] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#F5A623] rounded-xl flex items-center justify-center font-sora font-extrabold text-[#1A3A6B] text-2xl">
              S
            </div>
            <span className="font-sora font-extrabold text-2xl text-white">
              STYLO<span className="text-[#F5A623]">GESTOR</span>
            </span>
          </div>
          <p className="text-white font-semibold text-lg">
            {step === 'form' ? '14 dias grátis, sem cartão 🎉' : 'Confirme seu e-mail'}
          </p>
          <p className="text-white/60 text-sm mt-1">
            {step === 'form' ? 'Crie sua conta e comece agora' : `Enviamos um código para ${email}`}
          </p>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Senha (mínimo 8 caracteres)
              </label>
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1A3A6B] py-3 font-semibold text-white hover:bg-[#142d55] disabled:opacity-60"
            >
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Confira a caixa de entrada (e o spam) e digite o código de 6 dígitos.
            </p>
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-2xl tracking-[0.4em] text-gray-900 outline-none focus:border-[#1A3A6B]"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1A3A6B] py-3 font-semibold text-white hover:bg-[#142d55] disabled:opacity-60"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={handleResend} className="text-[#1A3A6B] font-medium hover:underline">
                Reenviar código
              </button>
              <button type="button" onClick={() => setStep('form')} className="text-gray-500 hover:underline">
                Corrigir e-mail
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-white/40 text-xs">
          Já tem conta?{' '}
          <Link href="/login" className="text-[#F5A623] hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
