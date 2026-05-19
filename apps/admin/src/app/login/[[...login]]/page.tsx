import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#0F172A]">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-9 h-9 bg-[#F5A623] rounded-lg flex items-center justify-center font-sora font-black text-[#1A3A6B] text-lg">S</div>
          <span className="font-sora font-extrabold text-white text-lg">STYLOGESTOR</span>
        </div>
        <p className="text-[10px] font-bold text-[#F5A623] uppercase tracking-widest">Admin SaaS</p>
      </div>
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/login"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
      />
      <p className="text-xs text-white/30 mt-6 max-w-sm text-center">
        Área restrita — somente administradores autorizados.
        Acesso é validado por email + role no Clerk.
      </p>
    </main>
  )
}
