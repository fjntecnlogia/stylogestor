import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Assinatura confirmada — STYLOGESTOR' }

const PLAN_NAMES: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium',
}

export default function SucessoPage({
  searchParams,
}: {
  searchParams: { plan?: string; session_id?: string }
}) {
  const planName = PLAN_NAMES[searchParams.plan || ''] || 'Pro'

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">
        {/* Ícone */}
        <div className="w-20 h-20 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>

        <h1 className="font-sora font-extrabold text-2xl text-[#111827] mb-2">
          Assinatura confirmada!
        </h1>
        <p className="text-[#6B7280] mb-6">
          Seu plano <strong className="text-[#1A3A6B]">{planName}</strong> está ativo.
          Bem-vindo ao STYLOGESTOR!
        </p>

        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 mb-6 text-left space-y-2">
          <p className="text-sm font-semibold text-[#065F46]">O que acontece agora:</p>
          <ul className="space-y-1 text-sm text-[#065F46]">
            <li>✓ Seu painel já está liberado com todos os recursos</li>
            <li>✓ Você receberá o recibo por e-mail</li>
            <li>✓ A cobrança é automática todo mês</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="bg-[#1A3A6B] text-white font-bold py-3.5 rounded-2xl hover:bg-[#142d55] transition-colors"
          >
            Ir para o Dashboard →
          </Link>
          <Link
            href="/configuracoes"
            className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            Configurar minha barbearia
          </Link>
        </div>

        <p className="text-xs text-[#9CA3AF] mt-6">
          Dúvidas?{' '}
          <a href="https://wa.me/5565996952828" className="text-[#1A3A6B] font-semibold hover:underline">
            Fale com nosso suporte
          </a>
        </p>
      </div>
    </div>
  )
}
