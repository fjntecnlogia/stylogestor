import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { CTAButton } from '@/components/cta-button'
import { LeadCapture } from '@/components/lead-capture'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'

const FEATURES = [
  { icon: '📅', title: 'Agenda inteligente',     desc: 'Calendário visual, agendamento online pelo cliente e confirmações automáticas pelo WhatsApp. Chega de cliente esquecendo.' },
  { icon: '💰', title: 'Financeiro completo',    desc: 'Fluxo de caixa, fechamento diário, comissões automáticas. Você sabe quanto entra, quanto sai e o que sobra.' },
  { icon: '👥', title: 'Gestão de clientes',     desc: 'Histórico completo, aniversários, fidelização e avaliações pós-atendimento. Seu cliente volta mais vezes.' },
  { icon: '✂️', title: 'Equipe e comissões',     desc: 'Cadastre profissionais, configure horários e acompanhe comissões em tempo real. Fim do estresse no acerto.' },
  { icon: '📦', title: 'Controle de estoque',    desc: 'Produtos, entradas, saídas e alertas de estoque mínimo. Nunca fique sem o essencial na hora errada.' },
  { icon: '📊', title: 'Relatórios e insights',  desc: 'Faturamento, ticket médio, serviços mais vendidos. Dados claros para tomar decisões inteligentes.' },
]

const TESTIMONIALS = [
  { name: 'Roberto Mendes', city: 'São Paulo — SP', business: 'Barbearia RM', rating: 5, result: '+R$2.400/mês', text: 'Antes eu controlava tudo no papel. Hoje sei exatamente quanto entrou, quanto saí e quem são meus melhores clientes. Nos primeiros 30 dias já recuperei o que pago por ano.' },
  { name: 'Patrícia Souza',  city: 'Belo Horizonte — MG', business: 'Studio PS', rating: 5, result: '-80% faltas', text: 'A agenda online foi o melhor investimento que fiz. Meus clientes agendam sozinhos e ainda recebem lembrete no WhatsApp. Reduzi as faltas em 80% — dinheiro que eu estava perdendo todo dia.' },
  { name: 'Carlos Alves',   city: 'Curitiba — PR', business: 'Barber Shop CA', rating: 5, result: '3h/dia economizadas', text: 'Tentei outros sistemas antes. Era tudo complicado demais. O STYLOGESTOR é simples, funciona de verdade e o suporte responde na hora. Economizo 3 horas por dia que antes jogava fora.' },
]

const PLANS = [
  { name: 'Starter', price: 79,  highlight: false, tag: '', pros: ['1 profissional','Agenda completa','Agendamento online pelo cliente','Cadastro de clientes ilimitado','Serviços e preços','Suporte por email'] },
  { name: 'Pro',     price: 149, highlight: true,  tag: 'Mais popular', pros: ['Até 5 profissionais','Tudo do Starter','WhatsApp automático','Financeiro completo','Fluxo de caixa','Comissões automáticas','Relatórios básicos','Suporte via chat prioritário'] },
  { name: 'Premium', price: 249, highlight: false, tag: 'Para quem quer o máximo', pros: ['Profissionais ilimitados','Tudo do Pro','Controle de estoque','CRM avançado','Fidelização de clientes','Relatórios avançados + PDF','Exportação Excel','Suporte prioritário 24h'] },
]

const COMPARISON = [
  { feature: 'Agenda online',         stylo: true,  trinks: true,  outros: false },
  { feature: 'WhatsApp automático',   stylo: true,  trinks: true,  outros: false },
  { feature: 'Financeiro completo',   stylo: true,  trinks: false, outros: false },
  { feature: 'Controle de estoque',   stylo: true,  trinks: false, outros: false },
  { feature: 'Suporte humanizado',    stylo: true,  trinks: false, outros: false },
  { feature: 'Preço acessível',       stylo: true,  trinks: false, outros: false },
  { feature: 'App mobile grátis',     stylo: true,  trinks: false, outros: false },
]

const STATS = [
  { value: '+1.200', label: 'barbearias e salões', icon: '✂️' },
  { value: '98%',    label: 'satisfação dos clientes', icon: '⭐' },
  { value: '14 dias',label: 'grátis sem cartão', icon: '🎁' },
  { value: '< 10min',label: 'para configurar tudo', icon: '⚡' },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* ── HERO ── */}
      <section className="bg-[#1A3A6B] text-white pt-20 pb-32 px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#F5A623]/8 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#1B8A5A]/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge urgência */}
          <div className="inline-flex items-center gap-2 bg-[#F5A623]/20 border border-[#F5A623]/30 text-[#F5A623] text-xs font-bold px-4 py-2 rounded-full mb-8 tracking-wider uppercase">
            <span className="w-2 h-2 bg-[#F5A623] rounded-full animate-pulse" />
            🔥 Oferta de lançamento — 14 dias grátis + onboarding gratuito
          </div>

          <h1 className="font-sora font-extrabold text-4xl md:text-6xl leading-[1.1] mb-6">
            Chega de perder dinheiro<br />
            com <span className="text-[#F5A623]">desorganização.</span>
          </h1>

          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            O sistema de gestão mais <strong className="text-white">simples e completo</strong> para barbearias e salões do Brasil.
            Agenda, financeiro, clientes e WhatsApp automático — tudo em um lugar.
          </p>
          <p className="text-white/50 text-sm mb-10">
            Mais de <strong className="text-white/70">1.200 estabelecimentos</strong> já usam. Sem cartão de crédito para começar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <CTAButton
              href={`${APP_URL}/cadastro`}
              location="hero_primary"
              className="bg-[#F5A623] text-[#1A3A6B] font-bold text-lg px-8 py-4 rounded-2xl hover:bg-[#e09610] transition-all hover:scale-105 shadow-2xl shadow-[#F5A623]/20"
            >
              Começar grátis por 14 dias →
            </CTAButton>
            <a href="#como-funciona"
              className="border border-white/30 text-white font-semibold text-lg px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors">
              Ver como funciona ↓
            </a>
          </div>

          <p className="text-white/30 text-xs">
            ✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Cancele quando quiser &nbsp;·&nbsp; ✓ Configuração em 10 minutos
          </p>

          {/* Stats sociais */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="font-sora font-extrabold text-2xl text-[#F5A623]">{s.value}</p>
                <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DORES ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">A realidade de quem não tem sistema</p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-[#1C1C2E]">Você se identifica com algum desses?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {[
              { icon: '📒', pain: 'Agenda no papel ou no WhatsApp', text: 'Marcação bagunçada, cliente que esquece, horário perdido. Você perde dinheiro toda semana sem perceber.' },
              { icon: '💸', pain: 'Não sabe quanto ganhou no mês',    text: 'Dinheiro entra, dinheiro sai, e no final você não sabe o que sobrou. Impossível crescer assim.' },
              { icon: '👻', pain: 'Cliente vai embora e some',        text: 'Sem histórico, sem contato, sem fidelização. Cada cliente perdido é R$40, R$60, R$100 indo embora.' },
              { icon: '😤', pain: 'Comissão calculada no sufoco',     text: 'Toda semana um estresse para calcular o que cada profissional ganhou. Erro gera briga e perde funcionário.' },
            ].map((p) => (
              <div key={p.pain} className="flex gap-4 p-5 bg-[#F8F6F2] rounded-2xl border border-[#E8E6E2] hover:border-[#1A3A6B]/20 transition-colors">
                <span className="text-3xl shrink-0">{p.icon}</span>
                <div>
                  <p className="font-bold text-[#1C1C2E] mb-1">{p.pain}</p>
                  <p className="text-sm text-[#4A4A5A] leading-relaxed">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-[#1A3A6B] rounded-2xl p-6 text-center">
            <p className="text-xl font-sora font-bold text-white">
              O STYLOGESTOR resolve <span className="text-[#F5A623]">tudo isso</span>. De uma vez. Por menos de R$5 por dia.
            </p>
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className="bg-[#F8F6F2] py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Tudo que você precisa</p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-[#1C1C2E]">Simples de usar.<br />Completo de verdade.</h2>
            <p className="text-[#4A4A5A] mt-3 max-w-xl mx-auto">Cada funcionalidade foi criada depois de conversar com centenas de donos de barbearia e salão.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-[#E8E6E2] shadow-sm hover:shadow-md hover:border-[#1A3A6B]/20 transition-all group">
                <span className="text-4xl block mb-4">{f.icon}</span>
                <h3 className="font-sora font-bold text-lg text-[#1C1C2E] mb-2 group-hover:text-[#1A3A6B] transition-colors">{f.title}</h3>
                <p className="text-sm text-[#4A4A5A] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <CTAButton href={`${APP_URL}/cadastro`} location="features_section"
              className="inline-block bg-[#1A3A6B] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#0d2347] transition-colors">
              Quero usar tudo isso grátis →
            </CTAButton>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Começar é fácil</p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-[#1C1C2E]">Começa em minutos, não em dias.</h2>
            <p className="text-[#4A4A5A] mt-3">Sem treinamento longo, sem técnico, sem complicação.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Crie sua conta', desc: 'Cadastro em 2 minutos. Sem cartão de crédito. 14 dias grátis para testar absolutamente tudo.', time: '2 min' },
              { n: '02', title: 'Configure em 10 min', desc: 'Adicione seus serviços, profissionais e horários. Nossa equipe te ajuda a configurar tudo se precisar.', time: '10 min' },
              { n: '03', title: 'Comece a receber', desc: 'Compartilhe seu link de agendamento pelo WhatsApp e Instagram. Clientes marcam online, você foca no atendimento.', time: 'Imediato' },
            ].map((step) => (
              <div key={step.n} className="text-center relative">
                <div className="w-16 h-16 bg-[#1A3A6B] rounded-2xl flex items-center justify-center font-sora font-extrabold text-2xl text-[#F5A623] mx-auto mb-4">
                  {step.n}
                </div>
                <span className="inline-block bg-[#D1FAE5] text-[#065F46] text-xs font-bold px-2 py-0.5 rounded-full mb-3">{step.time}</span>
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
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Resultados reais</p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-white">O que mudou para quem já usa.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => <span key={i} className="text-[#F5A623]">★</span>)}
                  </div>
                  <span className="bg-[#1B8A5A]/30 text-[#4ADE80] text-xs font-bold px-3 py-1 rounded-full">{t.result}</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-5 flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="border-t border-white/10 pt-4">
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-white/50 text-xs">{t.business} · {t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARATIVO ── */}
      <section className="bg-[#F8F6F2] py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Por que o STYLOGESTOR?</p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-[#1C1C2E]">Não é só mais um sistema.</h2>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden border border-[#E8E6E2] shadow-sm">
            <div className="grid grid-cols-4 bg-[#1A3A6B] text-white text-sm font-bold">
              <div className="p-4">Funcionalidade</div>
              <div className="p-4 text-center text-[#F5A623]">STYLOGESTOR</div>
              <div className="p-4 text-center text-white/50">Trinks</div>
              <div className="p-4 text-center text-white/50">Outros</div>
            </div>
            {COMPARISON.map((c, i) => (
              <div key={c.feature} className={`grid grid-cols-4 text-sm border-b border-[#F3F4F6] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8F6F2]'}`}>
                <div className="p-4 font-medium text-[#1C1C2E]">{c.feature}</div>
                <div className="p-4 text-center">{c.stylo ? <span className="text-[#1B8A5A] font-bold text-lg">✓</span> : <span className="text-red-400">✗</span>}</div>
                <div className="p-4 text-center">{c.trinks ? <span className="text-[#1B8A5A] font-bold text-lg">✓</span> : <span className="text-[#9CA3AF]">✗</span>}</div>
                <div className="p-4 text-center">{c.outros ? <span className="text-[#1B8A5A] font-bold text-lg">✓</span> : <span className="text-[#9CA3AF]">✗</span>}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[#9CA3AF] mt-4">*Comparativo baseado em planos básicos de cada plataforma.</p>
        </div>
      </section>

      {/* ── PREÇOS ── */}
      <section id="precos" className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Planos e preços</p>
            <h2 className="font-sora font-bold text-3xl md:text-4xl text-[#1C1C2E]">Preço justo para quem trabalha de verdade.</h2>
            <p className="text-[#4A4A5A] mt-3">14 dias grátis em qualquer plano · Sem cartão · Cancele quando quiser</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {PLANS.map((p) => (
              <div key={p.name} className={`rounded-2xl p-7 ${p.highlight ? 'bg-[#1A3A6B] text-white shadow-2xl shadow-[#1A3A6B]/30 scale-105 ring-2 ring-[#F5A623]' : 'bg-[#F8F6F2] border border-[#E8E6E2]'}`}>
                {p.tag && <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${p.highlight ? 'text-[#F5A623]' : 'text-[#6B7280]'}`}>{p.tag}</p>}
                <h3 className={`font-sora font-bold text-2xl mb-1 ${p.highlight ? 'text-white' : 'text-[#1C1C2E]'}`}>{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className={`text-sm ${p.highlight ? 'text-white/60' : 'text-[#4A4A5A]'}`}>R$</span>
                  <span className={`font-sora font-extrabold text-4xl ${p.highlight ? 'text-white' : 'text-[#1A3A6B]'}`}>{p.price}</span>
                  <span className={`text-sm ${p.highlight ? 'text-white/60' : 'text-[#4A4A5A]'}`}>/mês</span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {p.pros.map((pro) => (
                    <li key={pro} className="flex items-start gap-2 text-sm">
                      <span className={`font-bold mt-0.5 shrink-0 ${p.highlight ? 'text-[#F5A623]' : 'text-[#1B8A5A]'}`}>✓</span>
                      <span className={p.highlight ? 'text-white/80' : 'text-[#4A4A5A]'}>{pro}</span>
                    </li>
                  ))}
                </ul>
                <CTAButton
                  href={`${APP_URL}/cadastro?plan=${p.name.toLowerCase()}`}
                  location="pricing"
                  plan={p.name}
                  price={p.price}
                  className={`block text-center font-bold py-3.5 rounded-xl transition-all hover:scale-105 ${
                    p.highlight
                      ? 'bg-[#F5A623] text-[#1A3A6B] hover:bg-[#e09610] shadow-lg shadow-[#F5A623]/20'
                      : 'bg-[#1A3A6B] text-white hover:bg-[#0d2347]'
                  }`}
                >
                  Começar grátis por 14 dias
                </CTAButton>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-[#6B7280]">
            {['✓ 14 dias grátis', '✓ Sem cartão de crédito', '✓ Cancele a qualquer momento', '✓ Suporte incluído', '✓ Configuração gratuita'].map(t => (
              <span key={t} className="font-medium">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPTURA DE LEADS ── */}
      <section className="bg-[#1A3A6B] py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-4">Não perca a oferta</p>
          <h2 className="font-sora font-extrabold text-3xl md:text-4xl text-white mb-4 leading-tight">
            Receba um guia gratuito:<br />
            <span className="text-[#F5A623]">&ldquo;Como dobrar o faturamento da sua barbearia&rdquo;</span>
          </h2>
          <p className="text-white/60 mb-8">+ acesso antecipado ao STYLOGESTOR com 14 dias grátis</p>
          <LeadCapture />
          <p className="text-white/30 text-xs mt-4">Sem spam. Cancele quando quiser. Seus dados estão seguros.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#F8F6F2] py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Dúvidas frequentes</p>
            <h2 className="font-sora font-bold text-3xl text-[#1C1C2E]">Ficou alguma dúvida?</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'Preciso instalar alguma coisa?', a: 'Não. O STYLOGESTOR funciona 100% pelo navegador, no celular ou computador. Nada para baixar ou instalar.' },
              { q: 'Meu cliente precisa baixar um app?', a: 'Não. Seu cliente agenda pelo link que você compartilha — funciona em qualquer celular, direto pelo navegador.' },
              { q: 'E se eu não gostar? Tenho contrato?', a: 'Sem contrato, sem multa. Cancele quando quiser com apenas um clique. Seus dados ficam disponíveis por 30 dias após o cancelamento.' },
              { q: 'Quanto tempo leva para configurar?', a: 'Menos de 10 minutos. Nossa equipe também oferece onboarding gratuito para te ajudar a começar do jeito certo.' },
              { q: 'Funciona para salão de beleza também?', a: 'Sim! O STYLOGESTOR foi criado para barbearias E salões de beleza. Você pode configurar qualquer tipo de serviço.' },
              { q: 'Tem suporte se eu tiver dúvida?', a: 'Sim, suporte humano por WhatsApp e email. Sem robô, sem enrolação. Respondemos em até 4 horas em dias úteis.' },
            ].map((f) => (
              <details key={f.q} className="bg-white rounded-2xl border border-[#E8E6E2] group cursor-pointer">
                <summary className="p-5 font-semibold text-[#1C1C2E] list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-[#1A3A6B] group-open:rotate-180 transition-transform duration-200">↓</span>
                </summary>
                <p className="px-5 pb-5 text-sm text-[#4A4A5A] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-[#1A3A6B] py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A3A6B] via-[#1A3A6B] to-[#0d2347]" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-[#F5A623] text-sm font-bold uppercase tracking-widest mb-4">Última chance</p>
          <h2 className="font-sora font-extrabold text-3xl md:text-5xl text-white mb-4 leading-tight">
            Seu negócio merece um<br />
            <span className="text-[#F5A623]">sistema que funciona.</span>
          </h2>
          <p className="text-white/60 text-lg mb-10">
            Mais de 1.200 barbearias e salões já escolheram o STYLOGESTOR.<br />
            <strong className="text-white/80">Comece hoje grátis. Configure em 10 minutos.</strong>
          </p>
          <CTAButton
            href={`${APP_URL}/cadastro`}
            location="cta_final"
            className="inline-block bg-[#F5A623] text-[#1A3A6B] font-bold text-xl px-12 py-5 rounded-2xl hover:bg-[#e09610] transition-all hover:scale-105 shadow-2xl shadow-[#F5A623]/20 mb-4"
          >
            Criar minha conta grátis →
          </CTAButton>
          <p className="text-white/30 text-sm">✓ Sem cartão · ✓ 14 dias grátis · ✓ Cancele quando quiser</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0d2347] text-white/40 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-[#F5A623] rounded-lg flex items-center justify-center font-sora font-extrabold text-[#1A3A6B] text-sm">S</div>
                <span className="font-sora font-bold text-white/70">STYLOGESTOR</span>
              </div>
              <p className="text-xs leading-relaxed">O sistema de gestão mais simples e completo para barbearias e salões do Brasil.</p>
            </div>
            <div>
              <p className="font-semibold text-white/60 text-sm mb-3">Produto</p>
              <div className="space-y-2 text-xs">
                <a href="#funcionalidades" className="block hover:text-white/70 transition-colors">Funcionalidades</a>
                <a href="#precos" className="block hover:text-white/70 transition-colors">Preços</a>
                <a href="#depoimentos" className="block hover:text-white/70 transition-colors">Depoimentos</a>
                <a href="/ajuda" className="block hover:text-white/70 transition-colors">Ajuda</a>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white/60 text-sm mb-3">Empresa</p>
              <div className="space-y-2 text-xs">
                <a href="/sobre" className="block hover:text-white/70 transition-colors">Sobre nós</a>
                <a href="/termos" className="block hover:text-white/70 transition-colors">Termos de uso</a>
                <a href="/privacidade" className="block hover:text-white/70 transition-colors">Privacidade</a>
                <a href="/suporte" className="block hover:text-white/70 transition-colors">Suporte</a>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white/60 text-sm mb-3">Contato</p>
              <div className="space-y-2 text-xs">
                <a href="mailto:contato@stylogestor.com.br" className="block hover:text-white/70 transition-colors">contato@stylogestor.com.br</a>
                <a href="https://wa.me/5511999999999" className="block hover:text-white/70 transition-colors">WhatsApp Suporte</a>
                <a href="https://instagram.com/stylogestor" className="block hover:text-white/70 transition-colors">@stylogestor</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <p>© 2026 STYLOGESTOR · Todos os direitos reservados</p>
            <p>Feito com ❤️ para barbearias e salões do Brasil</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
