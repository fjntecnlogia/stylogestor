import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Central de Ajuda — STYLOGESTOR',
  description: 'Aprenda a usar o STYLOGESTOR. Guias completos para clientes e gestores de barbearias e salões de beleza.',
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.stylogestor.com.br'

const CLIENTE_STEPS = [
  {
    num: 1,
    title: 'Escolha os serviços',
    desc: 'Selecione um ou mais serviços da lista. O total e a duração aparecem automaticamente.',
    icon: '✂️',
  },
  {
    num: 2,
    title: 'Escolha o profissional',
    desc: 'Selecione o profissional de preferência ou escolha "Sem preferência" para qualquer um disponível.',
    icon: '👤',
  },
  {
    num: 3,
    title: 'Escolha a data e horário',
    desc: 'Veja os dias e horários disponíveis e escolha o que melhor se encaixa na sua rotina.',
    icon: '📅',
  },
  {
    num: 4,
    title: 'Informe seus dados',
    desc: 'Preencha nome e WhatsApp. Ative os lembretes para não esquecer o horário.',
    icon: '📱',
  },
  {
    num: 5,
    title: 'Confirme o agendamento',
    desc: 'Revise tudo e confirme. Pronto! Você recebe confirmação pelo WhatsApp.',
    icon: '✅',
  },
]

const GESTOR_MODULES = [
  {
    icon: '📊',
    title: 'Dashboard',
    desc: 'Visão geral do dia: agendamentos, faturamento, novos clientes e ticket médio. Tudo em tempo real.',
    items: ['KPIs do dia em cards', 'Lista de agendamentos de hoje', 'Gráfico de fluxo de caixa dos últimos 7 dias'],
  },
  {
    icon: '📅',
    title: 'Agenda',
    desc: 'Coração da operação diária. Gerencie todos os atendimentos em uma grade visual por profissional.',
    items: [
      'Visualização por profissional, dia ou semana',
      'Criar agendamentos clicando em horários vazios',
      'Alterar status: Agendado → Em atendimento → Concluído',
      'Registrar forma de pagamento e descontos',
      'Fechamento do dia com resumo financeiro',
    ],
  },
  {
    icon: '👥',
    title: 'Clientes (CRM)',
    desc: 'Gerencie o relacionamento com cada cliente. Veja histórico, gasto total e agende direto pelo perfil.',
    items: [
      'Busca por nome ou telefone',
      'Cadastrar novo cliente (nome, WhatsApp, e-mail)',
      'Ver total de visitas e gasto histórico',
      'Etiquetas VIP e Mensal',
      'Agendar direto pelo perfil do cliente',
    ],
  },
  {
    icon: '💰',
    title: 'Financeiro',
    desc: 'Controle total das entradas e saídas. Atendimentos concluídos entram automaticamente.',
    items: [
      'Resumo mensal: receita, despesas e lucro',
      'Histórico de transações com filtros',
      'Lançar receitas e despesas manuais',
      'Categorias: atendimentos, produtos, salários, contas fixas',
    ],
  },
  {
    icon: '✂️',
    title: 'Profissionais',
    desc: 'Cadastre sua equipe, defina serviços por profissional e acompanhe comissões.',
    items: [
      'Cadastrar barbeiros e profissionais',
      'Definir serviços que cada um realiza',
      'Configurar comissão percentual ou valor fixo',
      'Ativar/desativar (ex: em férias)',
    ],
  },
  {
    icon: '📋',
    title: 'Serviços',
    desc: 'Monte o cardápio da barbearia com preços, duração e visibilidade no agendamento online.',
    items: [
      'Cadastrar serviços com nome, preço e duração',
      'Definir se aparece no agendamento online',
      'Desativar serviços sem excluir',
    ],
  },
  {
    icon: '📦',
    title: 'Estoque',
    desc: 'Controle produtos usados e vendidos. Receba alertas quando o estoque estiver baixo.',
    items: [
      'Cadastrar produtos com quantidade mínima',
      'Registrar entradas (compras) e saídas (uso/venda)',
      'Alertas automáticos de reposição',
      'Histórico de movimentações',
    ],
  },
  {
    icon: '⭐',
    title: 'Fidelidade',
    desc: 'Programa de pontos para fidelizar clientes. Configure recompensas e acompanhe o ranking.',
    items: [
      'Pontos automáticos por atendimento',
      'Ranking de clientes por pontos',
      'Configurar recompensas (descontos, brindes)',
      'Adicionar pontos manualmente',
    ],
  },
  {
    icon: '🎧',
    title: 'Suporte',
    desc: 'Canal direto com a equipe STYLOGESTOR. Abra chamados, elogios, reclamações ou sugestões.',
    items: [
      'Tipos: Suporte técnico, Elogio, Reclamação, Sugestão',
      'Prioridades: Baixa, Média, Alta',
      'Acompanhar status dos chamados',
      'Resposta em até 2 horas úteis',
    ],
  },
]

const STATUS_LIST = [
  { label: 'Agendado', color: 'bg-[#FEF9C3] text-[#92400E]', desc: 'Marcado, aguardando atendimento' },
  { label: 'Confirmado', color: 'bg-[#DBEAFE] text-[#1E40AF]', desc: 'Cliente confirmou presença' },
  { label: 'Em atendimento', color: 'bg-[#FEE2E2] text-[#991B1B]', desc: 'Atendimento em andamento' },
  { label: 'Concluído', color: 'bg-[#D1FAE5] text-[#065F46]', desc: 'Finalizado e pago' },
  { label: 'Cancelado', color: 'bg-[#F3F4F6] text-[#6B7280]', desc: 'Cancelado pelo cliente ou gestor' },
  { label: 'Faltou', color: 'bg-[#FEF2F2] text-[#991B1B]', desc: 'Cliente não compareceu' },
]

const FAQS = [
  { q: 'Preciso criar uma conta para agendar?', a: 'Não. O cliente informa apenas nome e WhatsApp no momento do agendamento. Sem cadastro necessário.' },
  { q: 'Como o cliente recebe a confirmação?', a: 'Automaticamente pelo WhatsApp após confirmar o agendamento. Também é possível enviar lembretes antes do horário.' },
  { q: 'Posso ter mais de um profissional?', a: 'Sim. Os planos Pro e Premium suportam até 5 ou profissionais ilimitados, com agenda individual para cada um.' },
  { q: 'Como funciona o agendamento online?', a: 'Cada barbearia tem um link próprio (ex: suabarbearia.stylogestor.com.br). O cliente acessa e agenda em menos de 2 minutos.' },
  { q: 'O financeiro é atualizado automaticamente?', a: 'Sim. Quando um atendimento é marcado como "Concluído" na agenda, o valor entra automaticamente no financeiro.' },
  { q: 'Posso cancelar meu plano a qualquer momento?', a: 'Sim. Sem fidelidade e sem multa. Você cancela quando quiser pelo painel em Planos.' },
  { q: 'O STYLOGESTOR funciona no celular?', a: 'Sim. Tanto o painel do gestor quanto a página de agendamento do cliente são 100% responsivos.' },
  { q: 'Como entro em contato com o suporte?', a: 'Pelo painel em Suporte > Abrir chamado, pelo WhatsApp (65) 99696-52828 ou por e-mail em suporte@stylogestor.com.br.' },
]

export default function AjudaPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F2]">

      {/* HEADER */}
      <header className="bg-[#1A3A6B] text-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F5A623] rounded-lg flex items-center justify-center font-sora font-extrabold text-[#1A3A6B] text-base">S</div>
            <span className="font-sora font-extrabold text-lg">STYLO<span className="text-[#F5A623]">GESTOR</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <Link href="/#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</Link>
            <Link href="/#precos" className="hover:text-white transition-colors">Preços</Link>
            <Link href="/ajuda" className="text-white font-semibold">Ajuda</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href={`${APP_URL}/login`} className="text-sm text-white/70 hover:text-white hidden sm:block">Entrar</Link>
            <Link href={`${APP_URL}/cadastro`}
              className="bg-[#F5A623] text-[#1A3A6B] font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#e09610] transition-colors">
              Teste grátis
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-[#1A3A6B] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-[#F5A623]/20 text-[#F5A623] text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            Central de Ajuda
          </div>
          <h1 className="font-sora font-extrabold text-3xl md:text-5xl leading-tight mb-4">
            Como podemos ajudar?
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Guias completos para clientes e gestores de barbearias. Encontre tudo que precisa aqui.
          </p>
          {/* Navegação rápida */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <a href="#clientes" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              👤 Para clientes
            </a>
            <a href="#gestores" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              📊 Para gestores
            </a>
            <a href="#faq" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              ❓ Perguntas frequentes
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-24">

        {/* ─── SEÇÃO CLIENTE ─── */}
        <section id="clientes">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#1A3A6B]/10 text-[#1A3A6B] text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">Para o cliente</span>
            <h2 className="font-sora font-extrabold text-3xl text-[#1C1C2E]">Como agendar na barbearia</h2>
            <p className="text-[#4A4A5A] mt-3 max-w-xl mx-auto">Sem criar conta. Em menos de 2 minutos pelo celular ou computador.</p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 mb-10">
            {CLIENTE_STEPS.map((s) => (
              <div key={s.num} className="bg-white rounded-2xl border border-[#E8E6E2] p-5 text-center relative shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#1A3A6B] text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">{s.num}</div>
                <p className="text-2xl mb-2">{s.icon}</p>
                <p className="font-sora font-bold text-sm text-[#1C1C2E] mb-1">{s.title}</p>
                <p className="text-xs text-[#4A4A5A] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Dicas do cliente */}
          <div className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm overflow-hidden">
            <div className="bg-[#F0FDF4] border-b border-[#BBF7D0] px-6 py-4">
              <h3 className="font-sora font-bold text-[#065F46]">💡 Dúvidas frequentes do cliente</h3>
            </div>
            <div className="divide-y divide-[#E8E6E2]">
              {[
                { q: 'Preciso criar uma conta?', a: 'Não. Apenas nome e WhatsApp no momento do agendamento.' },
                { q: 'Como cancelo meu horário?', a: 'Entre em contato com a barbearia pelo WhatsApp informado no site.' },
                { q: 'Posso escolher mais de um serviço?', a: 'Sim! Na primeira etapa você pode selecionar quantos serviços quiser.' },
                { q: 'Recebo lembrete do horário?', a: 'Sim, por WhatsApp — se você marcar a opção na etapa de dados.' },
              ].map((item) => (
                <div key={item.q} className="px-6 py-4 flex gap-4">
                  <span className="text-[#F5A623] font-bold text-lg shrink-0">?</span>
                  <div>
                    <p className="font-semibold text-[#1C1C2E] text-sm">{item.q}</p>
                    <p className="text-[#4A4A5A] text-sm mt-0.5">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-[#1A3A6B] rounded-2xl p-6 text-center text-white">
            <p className="font-sora font-bold text-lg mb-2">Quer experimentar o agendamento?</p>
            <p className="text-white/70 text-sm mb-4">Veja como o cliente da sua barbearia vai ver a tela de agendamento.</p>
            <Link href="https://demo.stylogestor.com.br" target="_blank"
              className="inline-block bg-[#F5A623] text-[#1A3A6B] font-bold px-6 py-2.5 rounded-xl hover:bg-[#e09610] transition-colors text-sm">
              Ver demo de agendamento →
            </Link>
          </div>
        </section>

        {/* ─── SEÇÃO GESTOR ─── */}
        <section id="gestores">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#1A3A6B]/10 text-[#1A3A6B] text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">Para o gestor</span>
            <h2 className="font-sora font-extrabold text-3xl text-[#1C1C2E]">Guia completo do painel</h2>
            <p className="text-[#4A4A5A] mt-3 max-w-xl mx-auto">Conheça todos os módulos e como tirar o máximo do STYLOGESTOR.</p>
          </div>

          {/* Rotina diária */}
          <div className="bg-[#1A3A6B] rounded-2xl p-6 text-white mb-10">
            <h3 className="font-sora font-bold text-lg mb-4">📋 Rotina diária recomendada</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="font-bold text-[#F5A623] text-sm mb-2">☀️ Manhã</p>
                <ul className="space-y-1 text-sm text-white/80">
                  <li>→ Conferir Dashboard</li>
                  <li>→ Ver agenda do dia</li>
                  <li>→ Confirmar agendamentos</li>
                </ul>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="font-bold text-[#F5A623] text-sm mb-2">🕐 Durante o dia</p>
                <ul className="space-y-1 text-sm text-white/80">
                  <li>→ Criar agendamentos manuais</li>
                  <li>→ Atualizar status dos atendimentos</li>
                  <li>→ Registrar forma de pagamento</li>
                </ul>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="font-bold text-[#F5A623] text-sm mb-2">🌙 Final do dia</p>
                <ul className="space-y-1 text-sm text-white/80">
                  <li>→ Fechar o dia na Agenda</li>
                  <li>→ Conferir resumo financeiro</li>
                  <li>→ Verificar estoque se necessário</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Módulos */}
          <div className="grid md:grid-cols-2 gap-4">
            {GESTOR_MODULES.map((mod) => (
              <div key={mod.title} className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E8E6E2]">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{mod.icon}</span>
                    <div>
                      <p className="font-sora font-bold text-[#1C1C2E]">{mod.title}</p>
                      <p className="text-xs text-[#4A4A5A]">{mod.desc}</p>
                    </div>
                  </div>
                </div>
                <ul className="px-5 py-4 space-y-2">
                  {mod.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[#374151]">
                      <span className="text-[#1B8A5A] font-bold shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Status da agenda */}
          <div className="mt-8 bg-white rounded-2xl border border-[#E8E6E2] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E8E6E2]">
              <h3 className="font-sora font-bold text-[#1C1C2E]">📅 Status dos agendamentos</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Entenda o que cada cor e status significa na agenda</p>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-3">
              {STATUS_LIST.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${s.color} whitespace-nowrap`}>{s.label}</span>
                  <span className="text-sm text-[#4A4A5A]">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#1A3A6B]/10 text-[#1A3A6B] text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">FAQ</span>
            <h2 className="font-sora font-extrabold text-3xl text-[#1C1C2E]">Perguntas frequentes</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.q} className="bg-white rounded-2xl border border-[#E8E6E2] shadow-sm group overflow-hidden">
                <summary className="px-6 py-4 cursor-pointer flex items-center justify-between gap-4 select-none">
                  <span className="font-semibold text-[#1C1C2E]">{faq.q}</span>
                  <span className="text-[#1A3A6B] font-bold text-xl shrink-0 transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="px-6 pb-5 text-[#4A4A5A] text-sm leading-relaxed border-t border-[#E8E6E2] pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ─── CONTATO ─── */}
        <section className="bg-[#1A3A6B] rounded-2xl p-8 text-white text-center">
          <h2 className="font-sora font-extrabold text-2xl mb-2">Ainda tem dúvidas?</h2>
          <p className="text-white/70 mb-6">Nossa equipe responde em até 2 horas úteis.</p>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <a href="https://wa.me/5565996952828" target="_blank"
              className="flex items-center gap-2 bg-[#1B8A5A] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#156b47] transition-colors">
              💬 WhatsApp: (65) 99696-52828
            </a>
            <a href="mailto:suporte@stylogestor.com.br"
              className="flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
              📧 suporte@stylogestor.com.br
            </a>
          </div>
          <p className="text-white/40 text-sm">Seg–Sex 08h–18h · Sab 08h–12h</p>
        </section>

      </div>

      {/* FOOTER */}
      <footer className="bg-[#1A3A6B] text-white/50 py-8 px-4 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <span className="font-sora font-extrabold text-white">STYLO<span className="text-[#F5A623]">GESTOR</span></span>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <Link href="/ajuda" className="text-white font-medium">Ajuda</Link>
            <a href="mailto:suporte@stylogestor.com.br" className="hover:text-white transition-colors">Contato</a>
          </div>
          <p>© {new Date().getFullYear()} STYLOGESTOR. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  )
}
