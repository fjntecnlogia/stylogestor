import type { Metadata } from 'next'
import { Sora, Inter } from 'next/font/google'
import './globals.css'

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', weight: ['400','600','700','800'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400','500','600'] })

export const metadata: Metadata = {
  title: 'STYLOGESTOR Admin — Painel do Sistema',
  description: 'Painel administrativo do SaaS STYLOGESTOR',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${inter.variable}`}>
      <body className="bg-[#0F172A] text-white antialiased">{children}</body>
    </html>
  )
}
