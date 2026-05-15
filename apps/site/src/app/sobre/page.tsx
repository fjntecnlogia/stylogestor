import { SiteHeader } from '@/components/site-header'
import Link from 'next/link'

export const metadata = { title: 'Sobre nós — STYLOGESTOR' }

const VALORES = [
  { icon: '🤝', title: 'Simplicidade', desc: 'Tecnologia que qualquer pessoa usa sem precisar de treinamento.' },
  { icon: '🔒', title: 'Confiança', desc: 'Entregamos o que prometemos. Sem letra miúda, sem surpresas.' },
  { icon: '🇧🇷', title: 'Brasileiro', desc: 'Criado no Brasil, para o Brasil. Falamos a língua do seu negócio.' },
  { icon: '🚀', title: 'Resultado', desc: 'Cada funcionalidade existe para fazer você ganhar mais dinheiro.' },
  { icon: '🎧', title: 'Suporte real', desc: 'Pessoas reais respondendo. Sem robô, sem enrolação.' },
]

const TIME = [
  { nome: 'Felipe Nascimento', cargo: 'CEO & Fundador', foto: 'F', cidade: 'São Paulo, SP' },
  { nome: 'Juliana Costa', cargo: 'CTO', foto: 'J', cidade: 'Curitiba, PR' },
  { nome: 'Ricardo Alves', cargo: 'Head de Produto', foto: 'R', cidade: 'Belo Horizonte, MG' },
  { nome: 'Mariana Lima', cargo: 'Head de Suporte', foto: 'M', cidade: 'Rio de Janeiro, RJ' },
]

const NUMEROS = [
  { valor: '+1.200', label: 'barbearias e salões' },
  { valor: '5', label: 'estados do Brasil' },
  { valor: '98%', label: 'satisfação dos clientes' },
  { valor: '2024', label: 'ano de fundação' },
]

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-[#1A3A6B] text-white py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5A623]/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-4">Nossa história</p>
          <h1 className="font-sora font-extrabold text-4xl md:text-5xl mb-6 leading-tight">
            Nascemos dentro de<br />uma <span className="text-[#F5A623]">barbearia.</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            O STYLOGESTOR surgiu da frustração real de um dono de barbearia que não encontrava um sistema simples, completo e com preço justo para o Brasil.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-16 space-y-20">

        {/* Nossa história */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-3">Como tudo começou</p>
            <h2 className="font-sora font-bold text-3xl text-[#1C1C2E] mb-5">O problema que resolvemos</h2>
            <div className="space-y-4 text-[#4A4A5A] leading-relaxed">
              <p>Em 2024, Felipe Nascimento era dono de uma barbearia em São Paulo e vivia o caos do dia a dia: agenda no papel, dinheiro saindo sem controle e clientes esquecendo os horários.</p>
              <p>Ele testou vários sistemas. Eram caros, complicados ou incompletos. Nenhum foi feito pensando no barbeiro brasileiro de verdade.</p>
              <p>Então ele decidiu criar um. Juntou uma equipe de desenvolvedores, conversou com mais de 200 donos de barbearias e salões, e em 6 meses lançou o STYLOGESTOR.</p>
              <p className="font-semibold text-[#1A3A6B]">"A gente quer ser o parceiro que o barbeiro nunca teve. Simples assim."</p>
            </div>
          </div>
          <div className="bg-[#1A3A6B] rounded-2xl p-8 text-white">
            <div className="grid grid-cols-2 gap-6">
              {NUMEROS.map((n) => (
                <div key={n.label} className="text-center">
                  <p className="font-sora font-extrabold text-3xl text-[#F5A623] mb-1">{n.valor}</p>
                  <p className="text-white/60 text-sm">{n.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Missão, Visão, Valores */}
        <section>
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">O que nos guia</p>
            <h2 className="font-sora font-bold text-3xl text-[#1C1C2E]">Missão, visão e valores</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#1A3A6B] rounded-2xl p-6 text-white">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="font-sora font-bold text-lg mb-3">Missão</h3>
              <p className="text-white/70 text-sm leading-relaxed">Dar aos donos de barbearias e salões as ferramentas simples e poderosas que antes só grandes empresas tinham — sem complicação e com preço justo.</p>
            </div>
            <div className="bg-[#F5A623] rounded-2xl p-6 text-[#1A3A6B]">
              <div className="text-3xl mb-4">🔭</div>
              <h3 className="font-sora font-bold text-lg mb-3">Visão</h3>
              <p className="text-[#1A3A6B]/80 text-sm leading-relaxed">Ser o sistema de gestão mais amado por barbearias e salões do Brasil, presente em cada cadeira do país.</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#E8E6E2] p-6">
              <div className="text-3xl mb-4">💡</div>
              <h3 className="font-sora font-bold text-lg mb-3 text-[#1C1C2E]">Posicionamento</h3>
              <p className="text-[#4A4A5A] text-sm leading-relaxed">Para quem quer controle total sem complicação. Diferente dos concorrentes, falamos a sua língua e estamos sempre do seu lado.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {VALORES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-[#E8E6E2] p-5 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-sora font-bold text-sm text-[#1C1C2E] mb-2">{v.title}</h3>
                <p className="text-xs text-[#4A4A5A] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Time */}
        <section>
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Quem faz acontecer</p>
            <h2 className="font-sora font-bold text-3xl text-[#1C1C2E]">Nosso time</h2>
            <p className="text-[#4A4A5A] mt-3">Um time pequeno, mas muito comprometido com o seu sucesso.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TIME.map((pessoa) => (
              <div key={pessoa.nome} className="bg-white rounded-2xl border border-[#E8E6E2] p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-[#1A3A6B] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {pessoa.foto}
                </div>
                <p className="font-sora font-bold text-sm text-[#1C1C2E]">{pessoa.nome}</p>
                <p className="text-xs text-[#F5A623] font-semibold mt-1">{pessoa.cargo}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">📍 {pessoa.cidade}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1A3A6B] rounded-2xl p-10 text-center text-white">
          <h2 className="font-sora font-extrabold text-3xl mb-3">
            Quer fazer parte dessa história?
          </h2>
          <p className="text-white/60 mb-8">Junte-se a mais de 1.200 barbearias e salões que confiam no STYLOGESTOR.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="https://app.stylogestor.com.br/cadastro"
              className="bg-[#F5A623] text-[#1A3A6B] font-bold px-8 py-4 rounded-2xl hover:bg-[#e09610] transition-colors">
              Começar grátis por 14 dias →
            </Link>
            <Link href="/suporte"
              className="border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors">
              Falar com a equipe
            </Link>
          </div>
        </section>

      </main>

      <footer className="bg-[#0d2347] text-white/40 py-8 px-4 text-center text-sm">
        <p>© 2026 STYLOGESTOR · FJN Tecnologia Ltda. · <Link href="/termos" className="hover:text-white/70">Termos</Link> · <Link href="/privacidade" className="hover:text-white/70">Privacidade</Link></p>
      </footer>
    </div>
  )
}
