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
        // baseTheme: dark resolve o problema de contraste — sem isso o
        // Clerk usa o tema light em cima de fundo escuro e textos ficam
        // ilegíveis (cinza claro sobre cinza claro).
        baseTheme: dark,
        variables: {
          colorPrimary: '#F5A623',          // amarelo STYLOGESTOR (CTAs)
          colorBackground: '#1C2333',        // card do login
          colorInputBackground: '#0F172A',   // inputs (mais escuro pra destacar)
          colorInputText: '#FFFFFF',
          colorText: '#FFFFFF',
          colorTextSecondary: '#94A3B8',     // labels e helper text
          colorDanger: '#EF4444',
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
        },
        elements: {
          rootBox: 'mx-auto',
          card: 'bg-[#1C2333] border border-white/10 shadow-2xl',
          headerTitle: 'font-sora text-white text-xl',
          headerSubtitle: 'text-white/60 text-sm',
          socialButtonsBlockButton:
            'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
          socialButtonsBlockButtonText: 'text-white font-medium',
          dividerLine: 'bg-white/10',
          dividerText: 'text-white/40',
          formFieldLabel: 'text-white font-medium',
          formFieldInput:
            'bg-[#0F172A] border border-white/10 text-white placeholder:text-white/30',
          formButtonPrimary:
            'bg-[#F5A623] hover:bg-[#e0951c] text-[#1A3A6B] font-bold shadow-lg',
          footerActionText: 'text-white/50',
          footerActionLink: 'text-[#F5A623] hover:text-[#e0951c] font-semibold',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-[#F5A623]',
        },
      }}
    >
      <html lang="pt-BR" className={`${sora.variable} ${inter.variable}`}>
        <body className="bg-[#0F172A] text-white antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
