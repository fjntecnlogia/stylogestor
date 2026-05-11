'use client'

import { UserButton, Show } from '@clerk/nextjs'

export function Topbar() {
  const now = new Date()
  const date = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <header className="h-14 bg-white border-b border-[#E8E6E2] flex items-center justify-between px-6 shrink-0">
      <p className="text-sm text-[#4A4A5A] capitalize">{date}</p>
      <div className="flex items-center gap-3">
        <button className="bg-[#1A3A6B] text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-[#142d55] transition-colors">
          + Novo agendamento
        </button>
        <Show when="signed-in">
          <UserButton
            afterSignOutUrl="/login"
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
          />
        </Show>
      </div>
    </header>
  )
}
