import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'

const FEATURES = [
  { icon: '📅', title: 'Agenda inteligente',     desc: 'Calendário visual, agendamento online pelo cliente e confirmações automáticas pelo WhatsApp.' },
  { icon: '💰', title: 'Financeiro completo',    desc: 'Fluxo de caixa, fechamento diário, comissões automáticas e relatórios que você entende.' },
  { icon: '👥', title: 'Gestão de clientes',     desc: 'Histórico completo, aniversários, fidelização e avaliações automáticas pós-atendimento.' },
  { icon: '✂️', title: 'Equipe e comissões',     desc: 'Cadastre profissionais, configure horários individuais e acompanhe comissões em tempo real.' },
  { icon: '📦', title: 'Controle de estoque',    desc: 'Produtos, entradas e saídas, alertas de estoque mínimo. Nunca fique sem o essencial.' },
  { icon: '📊', title: 'Relatórios e insights',  desc: 'Faturamento, ticket médio, serviços mais vendidos. Dados claros para decisões inteligentes.' },
]

const TESTIMONIALS = [
  { name: 'Roberto Mendes', city: 'São Paulo — SP', business: 'Barbearia RM', rating: 5, text: 'Antes eu controlava tudo no papel. Hoje sei exatamente quanto entrou, quanto saí e quem são meus melhores clientes. O STYLOGESTOR mudou meu negócio.' },
  { name: 'Patrícia Souza',  city: 'Belo Horizonte — MG', business: 'Studio PS', rating: 5, text: 'A agenda online foi o melhor investimento que fiz. Meus clientes agendam sozinhos e ainda recebem lembrete no WhatsApp. Reduzi as faltas em 80%.' },
  { name: 'Carlos Alves',   city: 'Curitiba — PR', business: 'Barber Shop CA', rating: 5, text: 'Tentei outros sistemas antes. Era tudo complicado demais. O STYLOGESTOR é simples, funciona de verdade e o suporte responde na hora.' },
]

const PLANS = [
  { name: 'Starter', price: 79,  highlight: false, pros: ['1 profissional','Agenda completa','Agendamento online','Clientes ilimitados'] },
  { name: 'Pro',     price: 149, highlight: true,  pros: ['Até 5 profissionais','WhatsApp automático','Financeiro completo','Comissões automáticas','Relatórios básicos','Suporte via chat'] },
  { name: 'Premium', price: 249, highlight: false, pros: ['Profissionais ilimitados','Tudo do Pro','Controle de estoque','CRM avançado','Relatórios avançados','Suporte prioritário'] },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* ── HERO ── */}
      <section className="bg-[#1A3A6B] text-white pt-20 pb-28 px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5A623]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1B8A5A]/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-block bg-[#F5A623]/20 text-[#F5A623] text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
            +1.200 barbearias e salões confiam no STYLOGESTOR
          </div>
          <h1 className="font-sora font-extrabold text-4xl md:text-6xl leading-tight mb-6">
            Chega de bagunça.<br />
            <span className="text-[#F5A623]">Controle total</span> do<br />
            seu negócio.
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Agenda online, financeiro, clientes, comissões e relatórios — tudo em um sistema simples, feito para barbearias e salões brasileiros.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`${APP_URL}/cadastro`}
              className="bg-[#F5A623] text-[#1A3A6B] font-bold text-lg px-8 py-4 rounded-2xl hover:bg-[#e09610] transition-all hover:scale-105 shadow-xl">
              Começar grátis por 14 dias →
            </Link>
            <a href="#funcionalidades"
              className="border border-white/30 text-white font-semibold text-lg px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors">
              Ver como funciona
            </a>
          </div>
          <p className="text-white/40 text-sm mt-4">Sem cartão de crédito · Cancele quando quiser</p>
        </div>
      </section>

      {/* ── PROBLEMAS ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">A realidade do dia a dia</p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-[#1C1C2E]">Você se identifica com isso?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '📒', pain: 'Agenda no papel ou no WhatsApp', text: 'Marcação bagunçada, clientes que esquecem e horários perdidos.' },
              { icon: '💸', pain: 'Dinheiro saindo sem controle',    text: 'Você não sabe exatamente quanto fatura ou onde o dinheiro foi.' },
              { icon: '👻', pain: 'Clientes que somem',              text: 'Sem histórico, sem contato, sem fidelização. Cliente vai embora e você nem sabe.' },
              { icon: '😤', pain: 'Comissões calculadas na mão',     text: 'Toda semana um estresse para calcular o que cada profissional ganhou.' },
            ].map((p) => (
              <div key={p.pain} className="flex gap-4 p-5 bg-[#F8F6F2] rounded-2xl border border-[#E8E6E2]">
                <span className="text-3xl shrink-0">{p.icon}</span>
                <div>
                  <p className="font-bold text-[#1C1C2E] mb-1">{p.pain}</p>
                  <p className="text-sm text-[#4A4A5A]">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-xl font-sora font-bold text-[#1A3A6B]">O STYLOGESTOR resolve tudo isso. De uma vez.</p>
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className="bg-[#F8F6F2] py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Tudo que você precisa</p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-[#1C1C2E]">Simples de usar.<br/>Completo de verdade.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-[#E8E6E2] shadow-sm hover:shadow-md transition-shadow">
                <span className="text-4xl block mb-4">{f.icon}</span>
                <h3 className="font-sora font-bold text-lg text-[#1C1C2E] mb-2">{f.title}</h3>
                <p className="text-sm text-[#4A4A5A] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Em 3 passos</p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-[#1C1C2E]">Começa em minutos, não em horas.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Crie sua conta', desc: 'Cadastro em 2 minutos. Sem cartão de crédito. 14 dias grátis para testar tudo.' },
              { n: '02', title: 'Configure em 10 min', desc: 'Adicione seus serviços, profissionais e horários. Nossa IA sugere o que você precisa.' },
              { n: '03', title: 'Compartilhe e comece', desc: 'Envie seu link de agendamento. Clientes marcam online, você recebe no painel.' },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="w-16 h-16 bg-[#1A3A6B] rounded-2xl flex items-center justify-center font-sora font-extrabold text-2xl text-[#F5A623] mx-auto mb-4">
                  {step.n}
                </div>
                <h3 className="font-sora font-bold text-lg text-[#1C1C2E] mb-2">{step.title}</h3>
                <p className="text-sm text-[#4A4A5A] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section id="depoimentos" className="bg-[#1A3A6B] py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">O que nossos clientes dizem</p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-white">Resultados reais de barbearias reais.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => <span key={i} className="text-[#F5A623]">★</span>)}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-white/50 text-xs">{t.business} · {t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS ── */}
      <section id="precos" className="bg-[#F8F6F2] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Planos e preços</p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-[#1C1C2E]">Preço justo pra quem trabalha de verdade.</h2>
            <p className="text-[#4A4A5A] mt-3">14 dias grátis em qualquer plano · Sem cartão · Cancele quando quiser</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <div key={p.name} className={`rounded-2xl p-7 ${p.highlight ? 'bg-[#1A3A6B] text-white shadow-2xl scale-105' : 'bg-white border border-[#E8E6E2]'}`}>
                {p.highlight && <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-3">Mais popular</p>}
                <h3 className={`font-sora font-bold text-2xl mb-1 ${p.highlight ? 'text-white' : 'text-[#1C1C2E]'}`}>{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className={`font-sora font-extrabold text-4xl ${p.highlight ? 'text-white' : 'text-[#1A3A6B]'}`}>R$ {p.price}</span>
                  <span className={`text-sm ${p.highlight ? 'text-white/60' : 'text-[#4A4A5A]'}`}>/mês</span>
                </div>
                <ul className="space-y-2 mb-7">
                  {p.pros.map((pro) => (
                    <li key={pro} className="flex items-center gap-2 text-sm">
                      <span className={`font-bold ${p.highlight ? 'text-[#F5A623]' : 'text-[#1B8A5A]'}`}>✓</span>
                      <span className={p.highlight ? 'text-white/80' : 'text-[#4A4A5A]'}>{pro}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`${APP_URL}/cadastro`}
                  className={`block text-center font-bold py-3 rounded-xl transition-colors ${
                    p.highlight
                      ? 'bg-[#F5A623] text-[#1A3A6B] hover:bg-[#e09610]'
                      : 'border-2 border-[#1A3A6B] text-[#1A3A6B] hover:bg-[#1A3A6B]/5'
                  }`}>
                  Começar grátis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-[#1A3A6B] py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-sora font-extrabold text-3xl md:text-5xl text-white mb-4 leading-tight">
            Seu negócio merece um<br/><span className="text-[#F5A623]">sistema que funciona.</span>
          </h2>
          <p className="text-white/60 text-lg mb-10">14 dias grátis. Sem cartão. Sem enrolação.</p>
          <Link href={`${APP_URL}/cadastro`}
            className="inline-block bg-[#F5A623] text-[#1A3A6B] font-bold text-xl px-10 py-5 rounded-2xl hover:bg-[#e09610] transition-all hover:scale-105 shadow-2xl">
            Criar minha conta grátis →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0d2347] text-white/40 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#F5A623] rounded flex items-center justify-center font-sora font-extrabold text-[#1A3A6B] text-xs">S</div>
            <span className="font-sora font-bold text-white/60">STYLOGESTOR</span>
          </div>
          <div className="flex gap-6">
            <a href="/termos" className="hover:text-white/70 transition-colors">Termos de uso</a>
            <a href="/privacidade" className="hover:text-white/70 transition-colors">Privacidade</a>
            <Link href="/ajuda" className="hover:text-white/70 transition-colors">Ajuda</Link>
            <a href="mailto:suporte@stylogestor.com.br" className="hover:text-white/70 transition-colors">Suporte</a>
          </div>
          <p>© 2026 STYLOGESTOR · Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  )
}
