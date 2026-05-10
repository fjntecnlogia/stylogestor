import type { Metadata } from 'next'
import { Sora, Inter } from 'next/font/google'
import './globals.css'

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', weight: ['300','400','600','700','800'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['300','400','500','600'] })

export const metadata: Metadata = {
  title: 'STYLOGESTOR — Gestão completa para barbearias e salões',
  description: 'Sistema de gestão simples e completo para barbearias e salões de beleza. Agenda online, financeiro, clientes e muito mais. Teste grátis por 14 dias.',
  openGraph: {
    title: 'STYLOGESTOR — Seu estilo de gestão.',
    description: 'Gestão completa para barbearias e salões. 14 dias grátis.',
    siteName: 'STYLOGESTOR',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${inter.variable}`}>
      <body className="bg-[#F8F6F2] text-[#1C1C2E] antialiased">{children}</body>
    </html>
  )
}
