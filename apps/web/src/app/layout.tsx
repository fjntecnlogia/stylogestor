import type { Metadata } from 'next'
import { Sora, Inter } from 'next/font/google'
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
    <html lang="pt-BR" className={`${sora.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#F8F6F2] text-[#1C1C2E]">
        {children}
      </body>
    </html>
  )
}
