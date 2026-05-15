import { SiteHeader } from '@/components/site-header'
import Link from 'next/link'

export const metadata = { title: 'Suporte — STYLOGESTOR' }

const FAQS = [
  { q: 'Como faço para começar?', a: 'Clique em "Teste grátis" no topo da página, cadastre seu e-mail e configure sua barbearia em menos de 10 minutos. Sem cartão de crédito necessário.' },
  { q: 'O trial de 14 dias é realmente grátis?', a: 'Sim, 100% grátis. Sem captura de cartão de crédito. Você testa tudo por 14 dias e só assina se quiser continuar.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem multa, sem fidelidade, sem burocracia. Cancele com um clique no painel de configurações.' },
  { q: 'Meus clientes precisam baixar um aplicativo?', a: 'Não. Seus clientes agendam pelo link que você compartilha, direto no navegador do celular. Sem instalação.' },
  { q: 'O sistema funciona no celular?', a: 'Sim. O STYLOGESTOR é totalmente responsivo e funciona em qualquer dispositivo. Também temos apps para Android e iOS.' },
  { q: 'Como funciona o WhatsApp automático?', a: 'No plano Pro e Premium, o sistema envia lembretes automáticos de agendamento para seus clientes pelo WhatsApp. Basta conectar seu número.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Usamos criptografia TLS/HTTPS, backups automáticos e seguimos a LGPD. Seus dados nunca são vendidos.' },
  { q: 'Posso migrar meus dados de outro sistema?', a: 'Sim. Nossa equipe pode ajudar na migração. Entre em contato pelo chat ou e-mail.' },
]

export default function SuportePage() {
  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-[#1A3A6B] text-white py-16 px-4 text-center">
        <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-3">Central de suporte</p>
        <h1 className="font-sora font-extrabold text-4xl mb-4">Como podemos ajudar?</h1>
        <p className="text-white/70 max-w-xl mx-auto">Suporte humano, sem robô. Respondemos em até 4 horas em dias úteis.</p>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-16">

        {/* Canais de suporte */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: '💬',
              title: 'WhatsApp',
              desc: 'Resposta mais rápida — ideal para dúvidas rápidas e suporte técnico urgente.',
              action: 'Iniciar conversa',
              href: 'https://wa.me/5565996952828?text=Olá! Preciso de ajuda com o STYLOGESTOR.',
              color: '#1B8A5A',
              bg: '#ECFDF5',
            },
            {
              icon: '📧',
              title: 'E-mail',
              desc: 'Para questões detalhadas, anexos e histórico de atendimento.',
              action: 'Enviar e-mail',
              href: 'mailto:suporte@stylogestor.com.br',
              color: '#1A3A6B',
              bg: '#EFF6FF',
            },
            {
              icon: '📖',
              title: 'Central de ajuda',
              desc: 'Tutoriais, vídeos e guias completos para você mesmo resolver.',
              action: 'Ver artigos',
              href: '/ajuda',
              color: '#F5A623',
              bg: '#FFF7ED',
            },
          ].map((c) => (
            <div key={c.title} className="bg-white rounded-2xl border border-[#E8E6E2] p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: c.bg }}>
                {c.icon}
              </div>
              <h3 className="font-sora font-bold text-lg text-[#1C1C2E] mb-2">{c.title}</h3>
              <p className="text-sm text-[#4A4A5A] mb-5 leading-relaxed">{c.desc}</p>
              <a
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                className="inline-block font-bold text-sm px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
                style={{ background: c.color }}
              >
                {c.action} →
              </a>
            </div>
          ))}
        </div>

        {/* Horário de atendimento */}
        <div className="bg-[#1A3A6B] rounded-2xl p-6 text-white mb-16 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-sora font-bold text-lg mb-1">⏰ Horário de atendimento</h3>
            <p className="text-white/70 text-sm">Segunda a sexta: 08h às 18h · Sábado: 09h às 13h</p>
            <p className="text-white/50 text-xs mt-1">Fora do horário? Deixe sua mensagem e respondemos no próximo dia útil.</p>
          </div>
          <div className="flex items-center gap-2 bg-[#1B8A5A]/30 border border-[#1B8A5A]/50 px-4 py-2 rounded-xl">
            <div className="w-2 h-2 bg-[#4ADE80] rounded-full animate-pulse" />
            <span className="text-[#4ADE80] font-bold text-sm">Online agora</span>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Perguntas frequentes</p>
            <h2 className="font-sora font-bold text-3xl text-[#1C1C2E]">Dúvidas mais comuns</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.q} className="bg-white rounded-2xl border border-[#E8E6E2] group cursor-pointer">
                <summary className="px-6 py-4 font-semibold text-[#1C1C2E] list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-[#1A3A6B] text-lg group-open:rotate-180 transition-transform duration-200 ml-4 shrink-0">↓</span>
                </summary>
                <p className="px-6 pb-4 text-sm text-[#4A4A5A] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-[#4A4A5A] mb-4">Não encontrou o que procura?</p>
          <a
            href="https://wa.me/5565996952828?text=Olá! Preciso de ajuda com o STYLOGESTOR."
            target="_blank"
            className="inline-block bg-[#1B8A5A] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#166347] transition-colors"
          >
            💬 Falar com suporte agora
          </a>
        </div>

      </main>

      <footer className="bg-[#0d2347] text-white/40 py-8 px-4 text-center text-sm mt-8">
        <p>© 2026 STYLOGESTOR · <Link href="/termos" className="hover:text-white/70">Termos</Link> · <Link href="/privacidade" className="hover:text-white/70">Privacidade</Link></p>
      </footer>
    </div>
  )
}
