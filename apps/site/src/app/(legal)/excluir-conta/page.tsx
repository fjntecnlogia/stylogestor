import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Excluir conta · STYLOGESTOR',
  description: 'Solicite a exclusão da sua conta STYLOGESTOR e dos dados associados.',
}

const LAST_UPDATED = '26 de maio de 2026'
const SUPPORT_EMAIL = 'contato@stylogestor.com.br'

export default function ExcluirContaPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-zinc-200">
      <h1 className="mb-2 text-3xl font-bold">Excluir minha conta STYLOGESTOR</h1>
      <p className="mb-8 text-sm text-zinc-400">Última atualização: {LAST_UPDATED}</p>

      <section className="space-y-6 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:leading-relaxed">
        <p>
          Esta página explica como solicitar a exclusão da sua conta nos aplicativos{' '}
          <strong>STYLOGESTOR Gestor</strong> (para barbearias) e{' '}
          <strong>Agendar STYLOGESTOR</strong> (para clientes finais), bem como dos dados
          pessoais associados, em conformidade com a Lei Geral de Proteção de Dados (LGPD —
          Lei 13.709/2018) e com as políticas do Google Play.
        </p>

        <h2>Como solicitar a exclusão</h2>
        <p>
          Para excluir sua conta e os dados pessoais associados, envie um e-mail para{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Excluir%20conta%20STYLOGESTOR`}
            className="text-amber-400 underline"
          >
            {SUPPORT_EMAIL}
          </a>{' '}
          com as seguintes informações:
        </p>
        <ol className="ml-6 list-decimal space-y-1">
          <li>Assunto do e-mail: <strong>Excluir conta STYLOGESTOR</strong></li>
          <li>O e-mail cadastrado no app</li>
          <li>O nome do app que você usa (Agendar STYLOGESTOR ou STYLOGESTOR Gestor)</li>
          <li>
            Uma breve confirmação de que você é o titular da conta e deseja exclui-la
          </li>
        </ol>
        <p>
          Para sua segurança, a solicitação <strong>deve partir do mesmo endereço de
          e-mail cadastrado na conta</strong>. Solicitações por outras vias (ligações,
          redes sociais, WhatsApp) não serão atendidas para evitar exclusões indevidas.
        </p>

        <h2>Prazo de atendimento</h2>
        <p>
          A exclusão será concluída em até <strong>15 (quinze) dias úteis</strong> contados
          do recebimento da solicitação. Você receberá uma confirmação por e-mail quando o
          processo for concluído.
        </p>

        <h2>Quais dados são excluídos</h2>
        <p>
          Após a confirmação, removemos permanentemente:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Seu nome, e-mail, telefone e foto de perfil</li>
          <li>Suas credenciais de autenticação (senha hash via Clerk)</li>
          <li>Histórico de agendamentos pessoais (no app Agendar STYLOGESTOR)</li>
          <li>Preferências, configurações e qualquer dado de personalização</li>
          <li>
            <strong>No caso do app STYLOGESTOR Gestor:</strong> todos os dados do
            estabelecimento (clientes cadastrados, agendamentos, lançamentos financeiros,
            profissionais, serviços, estoque), <em>se você for o único usuário do
            estabelecimento</em>. Se houver outros usuários, apenas seu usuário é removido
            e os dados do estabelecimento são mantidos.
          </li>
        </ul>

        <h2>Quais dados podem ser mantidos</h2>
        <p>
          Por obrigação legal ou para defesa em processos administrativos/judiciais,
          podemos reter por períodos limitados:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            <strong>Registros fiscais</strong> de pagamentos (notas, recibos, comprovantes)
            por até <strong>5 anos</strong>, conforme legislação tributária brasileira
            (Código Tributário Nacional, art. 173).
          </li>
          <li>
            <strong>Logs de acesso e segurança</strong> (IP, timestamps, user-agent) por
            até <strong>6 meses</strong>, conforme Marco Civil da Internet (Lei
            12.965/2014, art. 15).
          </li>
          <li>
            Esses dados são <strong>pseudonimizados</strong> (desvinculados do seu nome) e
            ficam armazenados em ambiente segregado, com acesso restrito.
          </li>
        </ul>

        <h2>Diferença entre desinstalar e excluir</h2>
        <p>
          <strong>Desinstalar o app</strong> apenas remove o aplicativo do seu dispositivo,
          mas não exclui sua conta nem os dados nos nossos servidores. Para apagar tudo, é
          necessário fazer a solicitação por e-mail descrita acima.
        </p>

        <h2>Dúvidas</h2>
        <p>
          Em caso de dúvida, fale conosco em{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-amber-400 underline"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>

        <h2>Mais informações</h2>
        <p>
          Para detalhes sobre quais dados coletamos e como tratamos, leia também a nossa{' '}
          <a href="/privacidade" className="text-amber-400 underline">
            Política de Privacidade
          </a>
          .
        </p>
      </section>
    </main>
  )
}
