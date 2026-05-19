import { currentUser } from '@clerk/nextjs/server'
import { SignOutButton } from '@clerk/nextjs'

export default async function AcessoNegadoPage() {
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[#0F172A]">
      <div className="bg-[#1C2333] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="font-sora font-bold text-2xl text-white mb-2">Acesso negado</h1>
        <p className="text-sm text-white/60 mb-2">
          Esta área é restrita a administradores do SaaS.
        </p>
        {email && (
          <p className="text-xs text-white/40 mb-6">
            Logado como <span className="font-mono text-white/60">{email}</span> — esse usuário
            não está autorizado.
          </p>
        )}
        <div className="space-y-2 text-left bg-white/5 rounded-xl p-4 mb-6">
          <p className="text-xs text-white/60 font-semibold mb-2">Pra liberar acesso:</p>
          <p className="text-xs text-white/40">
            1. Adicione o email em <span className="font-mono text-[#F5A623]">ADMIN_EMAILS</span> no
            .env.production.local da VPS, OU
          </p>
          <p className="text-xs text-white/40">
            2. Setar <span className="font-mono text-[#F5A623]">publicMetadata.role = &quot;super_admin&quot;</span>
            {' '}no usuário pelo Clerk Dashboard.
          </p>
        </div>
        <SignOutButton redirectUrl="/login">
          <button className="bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            ← Sair e voltar ao login
          </button>
        </SignOutButton>
      </div>
    </main>
  )
}
