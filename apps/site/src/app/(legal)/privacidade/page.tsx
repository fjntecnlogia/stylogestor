import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade · STYLOGESTOR',
  description: 'Política de privacidade e tratamento de dados (LGPD)',
}

const LAST_UPDATED = '18 de maio de 2026'

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-zinc-200">
      <h1 className="mb-2 text-3xl font-bold">Política de Privacidade</h1>
      <p className="mb-8 text-sm text-zinc-400">Última atualização: {LAST_UPDATED}</p>

      <section className="space-y-6 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:leading-relaxed">
        <p>
          Esta política descreve como STYLOGESTOR coleta, usa e protege dados pessoais, em
          conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
        </p>

        <h2>1. Dados que coletamos</h2>
        <p>
          <strong>De você (gestor/dono do estabelecimento)</strong>:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Nome, e-mail, telefone (no cadastro via Clerk)</li>
          <li>Dados de pagamento (processados pelo Stripe — nunca tocamos no cartão)</li>
          <li>Logs de acesso (IP, user-agent, timestamps) para segurança</li>
        </ul>
        <p>
          <strong>Dos seus clientes (operadora)</strong>:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Nome, telefone, e-mail (opcional), data de nascimento (opcional)</li>
          <li>Histórico de agendamentos e atendimentos</li>
          <li>Dados financeiros relacionados aos serviços</li>
        </ul>
        <p>
          Para os dados dos seus clientes, <strong>você é o controlador</strong> (LGPD art. 5º
          VI) — quem decide o que coletar e como usar. STYLOGESTOR atua como
          <strong> operador</strong>, processando sob suas instruções.
        </p>

        <h2>2. Por que coletamos</h2>
        <ul className="ml-6 list-disc space-y-1">
          <li>Fornecer a plataforma e suas funcionalidades (agenda, financeiro, etc.)</li>
          <li>Processar pagamentos da sua assinatura</li>
          <li>Comunicar com você sobre o serviço (alertas, mudanças, dúvidas)</li>
          <li>Cumprir obrigações legais e fiscais</li>
          <li>Melhorar a plataforma (dados agregados/anonimizados)</li>
        </ul>

        <h2>3. Compartilhamento com terceiros</h2>
        <p>
          STYLOGESTOR usa os seguintes operadores subcontratados (todos com cláusulas de proteção
          de dados):
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li><strong>Clerk</strong> (autenticação) — armazena e-mail, senha hash, sessões</li>
          <li><strong>Stripe</strong> (pagamentos) — processa cartões; nunca chegam ao STYLOGESTOR</li>
          <li><strong>Evolution API / Ultra MSG</strong> (WhatsApp) — telefones de clientes que vc envia mensagem</li>
          <li><strong>Resend</strong> (e-mail transacional) — endereços de e-mail</li>
          <li><strong>Cloudflare</strong> (CDN/DNS/proteção) — IPs e dados de navegação</li>
          <li><strong>Hostinger</strong> (VPS) — hosting do banco e da aplicação</li>
        </ul>
        <p>Não vendemos seus dados. Não usamos para publicidade.</p>

        <h2>4. Onde os dados ficam armazenados</h2>
        <p>
          Servidores em São Paulo (VPS Hostinger). Backups diários criptografados, retenção 7 dias.
          Trânsito sempre via HTTPS (TLS 1.3).
        </p>

        <h2>5. Seus direitos (LGPD art. 18)</h2>
        <ul className="ml-6 list-disc space-y-1">
          <li>Confirmação da existência de tratamento</li>
          <li>Acesso aos seus dados</li>
          <li>Correção de dados incompletos/desatualizados</li>
          <li>Eliminação dos dados (após cancelamento da conta)</li>
          <li>Portabilidade (exportação em formato legível)</li>
          <li>Informação sobre compartilhamentos</li>
          <li>Revogação de consentimento</li>
        </ul>
        <p>
          Para exercer, envie e-mail para <a className="underline" href="mailto:privacidade@stylogestor.com.br">privacidade@stylogestor.com.br</a>.
          Respondemos em até 15 dias.
        </p>

        <h2>6. Retenção</h2>
        <ul className="ml-6 list-disc space-y-1">
          <li>Conta ativa: dados mantidos enquanto durar a assinatura</li>
          <li>Cancelamento: 90 dias pra reativação, depois deletamos (exceto dados fiscais obrigados por lei)</li>
          <li>Backups: 7 dias após dado ser removido do banco vivo</li>
        </ul>

        <h2>7. Cookies</h2>
        <p>
          Usamos cookies essenciais (sessão, preferências) e analíticos (Google Analytics —
          dados agregados, sem identificação pessoal direta). Você pode bloquear via navegador,
          mas algumas funcionalidades podem não funcionar.
        </p>

        <h2>8. Crianças</h2>
        <p>STYLOGESTOR não é direcionado a menores de 18 anos.</p>

        <h2>9. Encarregado de Dados (DPO)</h2>
        <p>
          Contato: <a className="underline" href="mailto:dpo@stylogestor.com.br">dpo@stylogestor.com.br</a>
        </p>

        <h2>10. Mudanças nesta política</h2>
        <p>
          Notificaremos mudanças significativas com 30 dias de antecedência por e-mail.
        </p>
      </section>
    </main>
  )
}
