import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-[#0F172A] via-[#131c2e] to-[#0F172A]">
      {/* Logo + título */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-11 h-11 bg-[#F5A623] rounded-xl flex items-center justify-center font-sora font-black text-[#1A3A6B] text-xl shadow-lg">
            S
          </div>
          <span className="font-sora font-extrabold text-white text-2xl tracking-tight">
            STYLOGESTOR
          </span>
        </div>
        <p className="text-[10px] font-bold text-[#F5A623] uppercase tracking-[0.3em]">
          Admin SaaS
        </p>
      </div>

      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/login"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
      />

      <p className="text-xs text-white/50 mt-8 max-w-sm text-center leading-relaxed">
        🔒 Área restrita — somente administradores autorizados.
        <br />
        Acesso validado por email allowlist + role no Clerk.
      </p>
    </main>
  )
}
