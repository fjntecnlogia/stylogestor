import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso · STYLOGESTOR',
  description: 'Termos de uso da plataforma STYLOGESTOR',
}

const LAST_UPDATED = '18 de maio de 2026'

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-zinc-200">
      <h1 className="mb-2 text-3xl font-bold">Termos de Uso</h1>
      <p className="mb-8 text-sm text-zinc-400">Última atualização: {LAST_UPDATED}</p>

      <section className="space-y-6 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:leading-relaxed">
        <p>
          Bem-vindo ao STYLOGESTOR. Ao acessar ou usar nossa plataforma, você concorda com estes
          Termos de Uso. Leia atentamente antes de utilizar nossos serviços.
        </p>

        <h2>1. Quem somos</h2>
        <p>
          STYLOGESTOR é uma plataforma SaaS de gestão para barbearias e salões de beleza, operada
          pela FJN Tecnologia (CNPJ a preencher). Contato: <a className="underline" href="mailto:contato@stylogestor.com.br">contato@stylogestor.com.br</a>.
        </p>

        <h2>2. Conta e cadastro</h2>
        <p>
          Para usar STYLOGESTOR você precisa criar uma conta com dados verdadeiros. Você é
          responsável pela confidencialidade das suas credenciais e por todas as atividades sob
          sua conta. Notifique imediatamente se houver uso não autorizado.
        </p>

        <h2>3. Planos e cobrança</h2>
        <p>
          Os planos disponíveis (Starter, Pro, Premium) e seus valores estão descritos em
          <a className="underline" href="/planos"> stylogestor.com.br/planos</a>. Cobrança recorrente
          via cartão de crédito; cancele a qualquer momento pelo portal do cliente — você mantém
          acesso até o fim do período pago.
        </p>

        <h2>4. Uso permitido</h2>
        <p>
          Você concorda em usar STYLOGESTOR apenas para fins legítimos relacionados à gestão da
          sua barbearia/salão. É proibido:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Compartilhar credenciais de acesso com terceiros não autorizados</li>
          <li>Tentar acessar dados de outros tenants (clientes da plataforma)</li>
          <li>Fazer engenharia reversa, descompilar ou tentar quebrar segurança</li>
          <li>Usar pra enviar spam, conteúdo ilegal ou que viole direitos de terceiros</li>
        </ul>

        <h2>5. Dados dos seus clientes</h2>
        <p>
          Você é o <strong>controlador</strong> dos dados que você cadastra (clientes, agenda,
          financeiro). STYLOGESTOR atua como <strong>operador</strong> conforme LGPD. Mantemos
          esses dados criptografados em trânsito (HTTPS) e em repouso (Postgres com isolamento
          multi-tenant), com backups diários.
        </p>

        <h2>6. Limitação de responsabilidade</h2>
        <p>
          STYLOGESTOR não se responsabiliza por: (a) interrupções de terceiros (Stripe, Clerk,
          Cloudflare, provedor de WhatsApp); (b) perda de dados causada por uso indevido do
          usuário; (c) impactos comerciais de eventuais downtimes (faremos o melhor esforço pra
          manter o serviço no ar — meta de uptime 99% mensal).
        </p>

        <h2>7. Cancelamento e portabilidade</h2>
        <p>
          Você pode cancelar a qualquer momento via portal do cliente. Após cancelamento, mantemos
          seus dados por 90 dias caso queira reativar; depois, deletamos. Você pode pedir exportação
          dos seus dados a qualquer momento por e-mail.
        </p>

        <h2>8. Mudanças nestes termos</h2>
        <p>
          Podemos atualizar estes termos. Mudanças significativas serão comunicadas por e-mail
          com pelo menos 30 dias de antecedência.
        </p>

        <h2>9. Lei aplicável</h2>
        <p>
          Estes termos são regidos pela legislação brasileira. Foro: comarca da sede da FJN Tecnologia.
        </p>

        <p className="mt-8 text-sm text-zinc-500">
          Dúvidas? Escreva para <a className="underline" href="mailto:contato@stylogestor.com.br">contato@stylogestor.com.br</a>.
        </p>
      </section>
    </main>
  )
}
