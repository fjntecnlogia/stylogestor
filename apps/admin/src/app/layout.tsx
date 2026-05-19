import type { Metadata } from 'next'
import { Sora, Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from '@clerk/localizations'
import { dark } from '@clerk/themes'
import './globals.css'

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', weight: ['400','600','700','800'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400','500','600'] })

export const metadata: Metadata = {
  title: 'STYLOGESTOR Admin — Painel do Sistema',
  description: 'Painel administrativo do SaaS STYLOGESTOR',
  robots: { index: false, follow: false }, // não indexa admin
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={ptBR}
      appearance={{
        // baseTheme: dark = base do Clerk (resolve cor de fundo + ajuda
        // o auto-contraste). Mas o dark theme do Clerk usa seletores
        // CSS específicos que sobrescrevem classes Tailwind comuns —
        // por isso usamos prefixo `!` (Tailwind !important) nos textos
        // críticos abaixo.
        baseTheme: dark,
        variables: {
          colorPrimary: '#F5A623',
          colorBackground: '#1C2333',
          colorInputBackground: '#0F172A',
          colorInputText: '#FFFFFF',
          colorText: '#FFFFFF',
          colorTextSecondary: '#CBD5E1',     // slate-300 (bem visível)
          colorDanger: '#EF4444',
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
        },
        elements: {
          rootBox: 'mx-auto',
          card: '!bg-[#1C2333] border border-white/10 shadow-2xl',
          // Headers — prefixo ! força sobrescrita do Clerk dark theme
          headerTitle: '!text-white !font-sora text-xl font-bold',
          headerSubtitle: '!text-white/70 text-sm',
          // Botão Google
          socialButtonsBlockButton:
            '!bg-white/5 hover:!bg-white/10 border border-white/10',
          socialButtonsBlockButtonText: '!text-white font-medium',
          socialButtonsProviderIcon: '!text-white',
          // Divisor "ou"
          dividerLine: '!bg-white/15',
          dividerText: '!text-white/60 font-medium',
          // Labels e inputs
          formFieldLabel: '!text-white font-semibold',
          formFieldLabelRow: '!text-white',
          formFieldInput:
            '!bg-[#0F172A] !border-white/10 !text-white placeholder:!text-white/40',
          formFieldInputShowPasswordButton: '!text-white/60',
          // Botão principal (Continuar)
          formButtonPrimary:
            '!bg-[#F5A623] hover:!bg-[#e0951c] !text-[#1A3A6B] font-bold shadow-lg',
          // Footer "Não possui uma conta? Registre-se"
          footer: '!bg-transparent',
          footerActionText: '!text-white/70',
          footerActionLink: '!text-[#F5A623] hover:!text-[#e0951c] font-semibold',
          footerAction__signIn: '!text-white/70',
          // Banner "Development mode"
          internal: '!text-white/40',
          // UserButton popover (sidebar do admin)
          userButtonPopoverCard: '!bg-[#1C2333] border border-white/10',
          userButtonPopoverText: '!text-white',
          userButtonPopoverActionButton: '!text-white hover:!bg-white/5',
          userButtonPopoverActionButtonText: '!text-white',
          userButtonPopoverFooter: '!bg-transparent !text-white/40',
          // Identity preview (volta da tela de password)
          identityPreviewText: '!text-white',
          identityPreviewEditButton: '!text-[#F5A623]',
          // Form de senha
          formResendCodeLink: '!text-[#F5A623]',
          alternativeMethodsBlockButton:
            '!text-white hover:!bg-white/5 !border-white/10',
        },
      }}
    >
      <html lang="pt-BR" className={`${sora.variable} ${inter.variable}`}>
        <body className="bg-[#0F172A] text-white antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
