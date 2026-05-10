import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
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
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'rounded-2xl shadow-2xl border-0',
              headerTitle: 'font-sora',
              formButtonPrimary: 'bg-[#1A3A6B] hover:bg-[#142d55] rounded-xl',
              footerActionLink: 'text-[#1A3A6B]',
            },
          }}
        />
        <p className="text-center text-white/40 text-xs">
          Não tem conta?{' '}
          <a href="/cadastro" className="text-[#F5A623] hover:underline font-medium">
            Teste grátis por 14 dias
          </a>
        </p>
      </div>
    </div>
  )
}
