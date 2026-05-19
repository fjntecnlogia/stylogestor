import type { Metadata } from 'next'
import { Sora, Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from '@clerk/localizations'
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
        variables: {
          colorPrimary: '#F5A623',
          colorBackground: '#0F172A',
          colorText: '#FFFFFF',
          colorInputBackground: '#1C2333',
          colorInputText: '#FFFFFF',
          borderRadius: '0.75rem',
        },
        elements: {
          formButtonPrimary: 'bg-[#F5A623] hover:opacity-90 text-[#1A3A6B] font-bold',
          card: 'bg-[#1C2333] border border-white/10',
        },
      }}
    >
      <html lang="pt-BR" className={`${sora.variable} ${inter.variable}`}>
        <body className="bg-[#0F172A] text-white antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
