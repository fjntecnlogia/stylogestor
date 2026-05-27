'use client'

import { useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

/**
 * Página /reset-conta — TEMPORÁRIA de recuperação.
 *
 * UI mínima pra disparar POST /api/me/reset-onboarding sem precisar
 * abrir DevTools. Usada quando a conta Clerk fica num estado
 * fantasma (publicMetadata aponta pra tenant deletado).
 *
 * Fluxo:
 *   1. Click "Resetar conta" → POST /api/me/reset-onboarding
 *   2. Limpa o localStorage do app (pra remover dados-fantasma)
 *   3. Faz signOut() no Clerk (necessário pra renovar o JWT)
 *   4. Redireciona pra /login
 *
 * Após logar de novo, o user cai no estado limpo e pode acessar
 * /onboarding pra criar a barbearia.
 *
 * Remover esta página quando não houver mais contas em estado
 * fantasma (ou mover pro admin SaaS).
 */
export default function ResetContaPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'resetting' | 'cleaning' | 'signing-out' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  const handleReset = async () => {
    setStep('resetting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/me/reset-onboarding', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Falha ao resetar')
        setStep('error')
        return
      }

      // 2) Limpa localStorage do app — remove os dados-fantasma
      // (clientes, agendamentos antigos do tenant que não existe mais)
      setStep('cleaning')
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {
        // Algumas configurações de navegador bloqueiam — segue mesmo assim
      }

      // 3) Logout no Clerk pra renovar JWT
      setStep('signing-out')
      await signOut()

      // 4) Vai pro login
      setStep('done')
      router.replace('/login')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado')
      setStep('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F2] p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 space-y-5">
        <div>
          <h1 className="font-sora font-bold text-xl text-[#1C1C2E]">🩹 Reset de conta</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Esta página apaga o vínculo da sua conta com a barbearia atual e te leva
            de volta pro fluxo de criar uma nova. Use quando a conta está &quot;presa&quot;
            num tenant que foi deletado.
          </p>
        </div>

        {user && (
          <div className="bg-[#F8F6F2] rounded-xl p-3 text-xs text-[#4A4A5A] space-y-0.5">
            <p>Conta logada:</p>
            <p className="font-mono text-[#1C1C2E] break-all">
              {user.primaryEmailAddress?.emailAddress || user.id}
            </p>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1.5">
          <p className="font-bold">⚠️ O que vai acontecer:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Limpa o vínculo com a barbearia atual no Clerk</li>
            <li>Apaga o cache local do navegador (dados-fantasma)</li>
            <li>Faz logout</li>
            <li>Te leva pra tela de login</li>
          </ol>
          <p className="pt-1">
            <strong>Nada é apagado do banco de dados.</strong> Se o tenant ainda
            existir, ele continua lá — só o vínculo da sua conta é solto.
          </p>
        </div>

        {step === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-900">
            ❌ {errorMsg}
          </div>
        )}

        {step !== 'idle' && step !== 'error' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
            {step === 'resetting' && '⏳ Limpando metadata da conta...'}
            {step === 'cleaning' && '⏳ Apagando cache local...'}
            {step === 'signing-out' && '⏳ Fazendo logout...'}
            {step === 'done' && '✅ Pronto! Redirecionando...'}
          </div>
        )}

        <button
          onClick={handleReset}
          disabled={step !== 'idle' && step !== 'error'}
          className="w-full bg-[#1A3A6B] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl hover:bg-[#142d55] transition-colors"
        >
          {step === 'idle' || step === 'error' ? 'Resetar conta agora' : 'Aguarde...'}
        </button>

        <p className="text-[10px] text-[#6B7280] text-center">
          Após o login, acesse <code className="bg-[#F8F6F2] px-1.5 py-0.5 rounded font-mono">/onboarding</code> pra criar a barbearia.
        </p>
      </div>
    </div>
  )
}
