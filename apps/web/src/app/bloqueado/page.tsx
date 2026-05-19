import Link from 'next/link'
import { PromoCodeInput } from '@/components/promo/promo-code-input'

export default function BloqueadoPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔒</span>
        </div>

        <h1 className="font-sora font-extrabold text-2xl text-[#111827] mb-2">
          Acesso suspenso
        </h1>
        <p className="text-[#6B7280] mb-2">
          Sua assinatura está com pagamento pendente ou foi cancelada.
        </p>
        <p className="text-[#6B7280] text-sm mb-6">
          Renove agora para continuar usando o STYLOGESTOR e não perder seus dados.
        </p>

        <div className="bg-[#FEF9C3] border border-[#FCD34D] rounded-2xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-[#92400E] mb-1">⚠️ O que está bloqueado:</p>
          <ul className="text-sm text-[#92400E] space-y-1">
            <li>• Agenda e agendamentos</li>
            <li>• Link de agendamento dos clientes</li>
            <li>• Financeiro e relatórios</li>
            <li>• Todos os módulos do sistema</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/planos"
            className="bg-[#1A3A6B] text-white font-bold py-3.5 rounded-2xl hover:bg-[#142d55] transition-colors"
          >
            🔓 Renovar assinatura agora
          </Link>
          <a
            href="https://billing.stripe.com/p/login/live_eVaaEO0dL3x6grS288"
            target="_blank"
            className="border-2 border-[#1A3A6B] text-[#1A3A6B] font-bold py-3 rounded-2xl hover:bg-[#F0F4FF] transition-colors text-sm"
          >
            Atualizar forma de pagamento
          </a>
          <a
            href="https://wa.me/5565996952828"
            target="_blank"
            className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            💬 Falar com suporte no WhatsApp
          </a>
        </div>

        {/* Resgate de código promocional — última saída antes de pagar */}
        <div className="mt-6 text-left">
          <PromoCodeInput
            title="🎟️ Tem um código?"
            subtitle="Se tem um código promocional, digite aqui pra ganhar dias extras."
          />
        </div>

        <p className="text-xs text-[#9CA3AF] mt-6">
          Seus dados ficam salvos por 30 dias após o vencimento.
        </p>
      </div>
    </div>
  )
}
