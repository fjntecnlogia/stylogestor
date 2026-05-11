import type { Metadata } from 'next'
import { Sora, Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from '@clerk/localizations'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['300', '400', '600', '700', '800'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'STYLOGESTOR — Seu estilo de gestão',
  description: 'Sistema de gestão completo para barbearias e salões de beleza',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={ptBR}
      appearance={{
        variables: {
          colorPrimary: '#1A3A6B',
          colorTextOnPrimaryBackground: '#FFFFFF',
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-inter)',
        },
        elements: {
          formButtonPrimary: 'bg-[#1A3A6B] hover:bg-[#142d55]',
          card: 'rounded-2xl shadow-2xl',
          headerTitle: 'font-sora',
        },
      }}
    >
      <html lang="pt-BR" className={`${sora.variable} ${inter.variable} h-full antialiased`}>
        <body className="min-h-full bg-[#F8F6F2] text-[#1C1C2E]">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
