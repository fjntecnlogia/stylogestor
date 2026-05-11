import { SignUp } from '@clerk/nextjs'

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-[#1A3A6B] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#F5A623] rounded-xl flex items-center justify-center font-sora font-extrabold text-[#1A3A6B] text-2xl">S</div>
            <span className="font-sora font-extrabold text-2xl text-white">
              STYLO<span className="text-[#F5A623]">GESTOR</span>
            </span>
          </div>
          <p className="text-white font-semibold text-lg">14 dias grátis, sem cartão 🎉</p>
          <p className="text-white/60 text-sm mt-1">Crie sua conta e comece agora</p>
        </div>

        <SignUp
          routing="hash"
          signInUrl="/login"
          fallbackRedirectUrl="/onboarding"
        />

        <p className="text-center text-white/40 text-xs">
          Já tem conta?{' '}
          <a href="/login" className="text-[#F5A623] hover:underline font-medium">Entrar</a>
        </p>
      </div>
    </div>
  )
}
