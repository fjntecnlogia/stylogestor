import Link from 'next/link'

const MODULES = [
  {
    icon: '📊', title: 'Dashboard',
    desc: 'Visão geral do seu negócio em tempo real.',
    tips: ['KPIs do dia: caixa, agendamentos, ticket médio', 'Gráfico de fluxo de caixa dos últimos 7 dias', 'Lista de agendamentos de hoje com status'],
  },
  {
    icon: '📅', title: 'Agenda',
    desc: 'Gerencie todos os atendimentos do dia.',
    tips: ['Clique em um horário vazio para criar agendamento', 'Clique em um agendamento para ver detalhes e alterar status', 'Use "Fechar dia" no final para ver o resumo financeiro', 'Modos: Por Profissional, Dia ou Semana'],
  },
  {
    icon: '👥', title: 'Clientes',
    desc: 'Cadastro e histórico completo de clientes.',
    tips: ['Busque por nome ou telefone', 'Clique no cliente para ver histórico e agendar', '"+ Novo cliente" cadastra nome, WhatsApp, e-mail e observações', 'Tags VIP e Mensal aparecem automaticamente'],
  },
  {
    icon: '💰', title: 'Financeiro',
    desc: 'Controle de entradas e saídas.',
    tips: ['Atendimentos concluídos entram automaticamente', 'Lance despesas manualmente com "+ Nova transação"', 'Filtre por Entradas, Saídas ou Todos', 'Acompanhe saldo, receita e despesas do dia'],
  },
  {
    icon: '✂️', title: 'Profissionais',
    desc: 'Gestão da equipe e comissões.',
    tips: ['Cadastre cada profissional com foto e serviços', 'Configure comissão percentual ou valor fixo', 'Ative/desative sem excluir (ex: férias)', 'Cada profissional tem agenda individual'],
  },
  {
    icon: '📋', title: 'Serviços',
    desc: 'Cardápio de serviços com preços e duração.',
    tips: ['Defina nome, preço e duração de cada serviço', 'Controle se aparece no agendamento online', 'Desative serviços temporariamente', 'Configure comissão por serviço'],
  },
  {
    icon: '📦', title: 'Estoque',
    desc: 'Controle de produtos e insumos.',
    tips: ['Cadastre produtos com quantidade mínima', 'Registre entradas (compras) e saídas (uso/venda)', 'Alertas automáticos de reposição', 'Histórico completo de movimentações'],
  },
  {
    icon: '⭐', title: 'Fidelidade',
    desc: 'Programa de pontos para seus clientes.',
    tips: ['Pontos são acumulados a cada atendimento', 'Configure quantos pontos valem por R$', 'Defina recompensas (descontos, brindes)', 'Veja o ranking dos clientes mais fiéis'],
  },
]

const STATUS_LIST = [
  { label: 'Agendado',       color: 'bg-[#FEF9C3] text-[#92400E]',  desc: 'Marcado, aguardando atendimento' },
  { label: 'Confirmado',     color: 'bg-[#DBEAFE] text-[#1E40AF]',  desc: 'Cliente confirmou presença' },
  { label: 'Em atendimento', color: 'bg-[#FEE2E2] text-[#991B1B]',  desc: 'Atendimento em andamento' },
  { label: 'Concluído',      color: 'bg-[#D1FAE5] text-[#065F46]',  desc: 'Finalizado e pago' },
  { label: 'Cancelado',      color: 'bg-[#F3F4F6] text-[#6B7280]',  desc: 'Cancelado pelo cliente ou gestor' },
  { label: 'Faltou',         color: 'bg-[#FEF2F2] text-[#991B1B]',  desc: 'Cliente não compareceu' },
]

const FAQS = [
  { q: 'Como o cliente agenda online?', a: 'O cliente acessa o link da sua barbearia (ex: suabarbearia.stylogestor.com.br), escolhe o serviço, profissional, data e horário, informa nome e WhatsApp e confirma. Sem criar conta.' },
  { q: 'Como compartilho o link de agendamento?', a: 'Acesse Configurações > Link de agendamento. Copie e envie pelo WhatsApp, Instagram ou cole na sua bio.' },
  { q: 'O financeiro é atualizado automaticamente?', a: 'Sim. Ao marcar um atendimento como Concluído na Agenda, o valor entra automaticamente no Financeiro.' },
  { q: 'Como adicionar um novo profissional?', a: 'Acesse Profissionais > + Novo profissional. Preencha nome, serviços que realiza e comissão. O profissional já aparece na agenda.' },
  { q: 'Posso usar no celular?', a: 'Sim! O painel é totalmente responsivo. Use o ícone ☰ no canto superior esquerdo para abrir o menu no celular.' },
  { q: 'Como trocar meu plano?', a: 'Acesse Planos no menu lateral ou clique em "Mudar" no rodapé da sidebar. Você pode fazer upgrade ou downgrade a qualquer momento.' },
]

export default function AjudaGestorPage() {
  return (
    <div className="space-y-8 max-w-5xl">

      {/* Header */}
      <div className="bg-[#1A3A6B] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-sora font-extrabold text-2xl mb-1">❓ Central de Ajuda</h1>
            <p className="text-white/70 text-sm">Guia completo para gestores do STYLOGESTOR.</p>
          </div>
          <Link
            href="https://stylogestor.com.br/ajuda"
            target="_blank"
            className="text-xs bg-white/10 border border-white/20 text-white font-semibold px-4 py-2 rounded-xl hover:bg-white/20 transition-colors shrink-0"
          >
            🌐 Ver ajuda completa →
          </Link>
        </div>

        {/* Rotina diária */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {[
            { title: '☀️ Manhã', items: ['Verificar Dashboard', 'Confirmar agenda do dia', 'Ver agendamentos pendentes'] },
            { title: '🕐 Durante o dia', items: ['Criar agendamentos manuais', 'Atualizar status dos atendimentos', 'Registrar forma de pagamento'] },
            { title: '🌙 Final do dia', items: ['Fechar o dia na Agenda', 'Conferir resumo financeiro', 'Verificar alertas de estoque'] },
          ].map((r) => (
            <div key={r.title} className="bg-white/10 rounded-xl p-4">
              <p className="font-bold text-[#F5A623] text-sm mb-2">{r.title}</p>
              <ul className="space-y-1">
                {r.items.map((i) => <li key={i} className="text-white/80 text-xs">→ {i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Módulos */}
      <div>
        <h2 className="font-sora font-bold text-lg text-[#111827] mb-4">Guia por módulo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULES.map((mod) => (
            <div key={mod.title} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center gap-3">
                <span className="text-2xl">{mod.icon}</span>
                <div>
                  <p className="font-sora font-bold text-[#111827]">{mod.title}</p>
                  <p className="text-xs text-[#6B7280]">{mod.desc}</p>
                </div>
              </div>
              <ul className="px-5 py-4 space-y-2">
                {mod.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-sm text-[#374151]">
                    <span className="text-[#1B8A5A] font-bold shrink-0 mt-0.5">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Status da agenda */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <p className="font-sora font-bold text-[#111827]">📅 Status dos agendamentos</p>
          <p className="text-xs text-[#6B7280] mt-0.5">O que significa cada cor na agenda</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STATUS_LIST.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${s.color}`}>{s.label}</span>
              <span className="text-sm text-[#4A4A5A]">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="font-sora font-bold text-lg text-[#111827] mb-4">Perguntas frequentes</h2>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details key={faq.q} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm group overflow-hidden">
              <summary className="px-5 py-4 cursor-pointer flex items-center justify-between gap-4 select-none">
                <span className="font-semibold text-[#111827] text-sm">{faq.q}</span>
                <span className="text-[#1A3A6B] font-bold text-xl shrink-0 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-4 text-[#6B7280] text-sm leading-relaxed border-t border-[#E5E7EB] pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Suporte */}
      <div className="bg-[#F0F4FF] border border-[#BFDBFE] rounded-2xl p-5">
        <h3 className="font-semibold text-[#1E40AF] mb-2">Não encontrou o que precisava?</h3>
        <p className="text-sm text-[#6B7280] mb-4">Nossa equipe responde em até 2 horas úteis nos dias úteis.</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/suporte"
            className="bg-[#1A3A6B] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#142d55] transition-colors"
          >
            🎧 Abrir chamado de suporte
          </Link>
          <a
            href="https://wa.me/5565996952828"
            target="_blank"
            className="bg-[#1B8A5A] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#156b47] transition-colors"
          >
            💬 WhatsApp direto
          </a>
        </div>
        <p className="text-xs text-[#6B7280] mt-3">Seg–Sex 08h–18h · Sab 08h–12h</p>
      </div>

    </div>
  )
}
