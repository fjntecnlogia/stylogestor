'use client'

// Substitui o <UserButton> do Clerk: avatar com a inicial do usuário que,
// ao clicar, faz logout (Supabase) e volta pro /login.

import { useUser, signOut } from '@/lib/use-user'

export function UserMenu({ size = 32 }: { size?: number }) {
  const { user } = useUser()
  const name =
    (user?.user_metadata as { name?: string } | undefined)?.name ||
    user?.email ||
    'U'
  const initial = name.charAt(0).toUpperCase()

  return (
    <button
      type="button"
      onClick={() => {
        if (confirm('Deseja sair da conta?')) signOut()
      }}
      title="Sair da conta"
      aria-label="Sair da conta"
      className="rounded-full bg-[#1A3A6B] text-white flex items-center justify-center font-bold hover:bg-[#142d55] transition-colors shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </button>
  )
}
