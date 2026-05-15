import { SiteHeader } from '@/components/site-header'
import Link from 'next/link'

export const metadata = { title: 'Política de Privacidade — STYLOGESTOR' }

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-10">
          <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Legal</p>
          <h1 className="font-sora font-extrabold text-4xl text-[#1C1C2E] mb-3">Política de Privacidade</h1>
          <p className="text-[#4A4A5A]">Última atualização: 15 de maio de 2026 · Em conformidade com a LGPD (Lei 13.709/2018)</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E6E2] p-8 space-y-8 text-[#4A4A5A] leading-relaxed">

          <section className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-5">
            <p className="text-[#1A3A6B] font-semibold text-sm">🔒 Resumo: Coletamos apenas os dados necessários para operar o sistema. Nunca vendemos seus dados. Você tem controle total sobre suas informações.</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">1. Quem somos</h2>
            <p>O STYLOGESTOR é operado pela <strong>FJN Tecnologia Ltda.</strong>, responsável pelo tratamento dos seus dados pessoais. Controlador de dados: FJN Tecnologia Ltda. — CNPJ 47.123.456/0001-89. Contato DPO: <a href="mailto:privacidade@stylogestor.com.br" className="text-[#1A3A6B] hover:underline">privacidade@stylogestor.com.br</a></p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">2. Dados que coletamos</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-[#1C1C2E] mb-2">2.1 Dados do Gestor (você)</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Nome completo e e-mail (cadastro)</li>
                  <li>Dados da empresa (nome, endereço, telefone)</li>
                  <li>Dados de pagamento (processados pelo Stripe — não armazenamos cartões)</li>
                  <li>Dados de uso do sistema (logs de acesso, funcionalidades utilizadas)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[#1C1C2E] mb-2">2.2 Dados dos seus clientes</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Nome, telefone e e-mail (para agendamentos)</li>
                  <li>Histórico de serviços e visitas</li>
                  <li>Você é o controlador desses dados — nós somos apenas operadores</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[#1C1C2E] mb-2">2.3 Dados técnicos</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Endereço IP, navegador e dispositivo</li>
                  <li>Cookies de sessão e preferências</li>
                  <li>Dados de analytics (Google Analytics 4)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">3. Como usamos seus dados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F8F6F2]">
                    <th className="text-left p-3 border border-[#E8E6E2] font-semibold text-[#1C1C2E]">Finalidade</th>
                    <th className="text-left p-3 border border-[#E8E6E2] font-semibold text-[#1C1C2E]">Base Legal (LGPD)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Fornecer os serviços do sistema', 'Execução de contrato (Art. 7º, V)'],
                    ['Processar pagamentos', 'Execução de contrato (Art. 7º, V)'],
                    ['Enviar notificações do sistema', 'Execução de contrato (Art. 7º, V)'],
                    ['Melhorar o produto e suporte', 'Legítimo interesse (Art. 7º, IX)'],
                    ['Comunicações de marketing', 'Consentimento (Art. 7º, I)'],
                    ['Cumprir obrigações legais', 'Obrigação legal (Art. 7º, II)'],
                  ].map(([fin, base]) => (
                    <tr key={fin}>
                      <td className="p-3 border border-[#E8E6E2]">{fin}</td>
                      <td className="p-3 border border-[#E8E6E2] text-[#1A3A6B]">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">4. Compartilhamento de dados</h2>
            <p className="mb-3">Compartilhamos seus dados apenas com:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Stripe</strong> — processamento de pagamentos</li>
              <li><strong>Clerk</strong> — autenticação e gerenciamento de usuários</li>
              <li><strong>Google Analytics</strong> — métricas de uso (dados anonimizados)</li>
              <li><strong>Autoridades públicas</strong> — quando exigido por lei</li>
            </ul>
            <p className="mt-3 font-semibold text-[#1B8A5A]">❌ Nunca vendemos seus dados para terceiros.</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">5. Seus direitos (LGPD)</h2>
            <p className="mb-3">Conforme a LGPD, você tem direito a:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['✅ Acesso', 'Ver todos os dados que temos sobre você'],
                ['✏️ Correção', 'Corrigir dados incompletos ou desatualizados'],
                ['🗑️ Exclusão', 'Solicitar a exclusão dos seus dados'],
                ['📤 Portabilidade', 'Exportar seus dados em formato estruturado'],
                ['🚫 Oposição', 'Opor-se ao tratamento baseado em legítimo interesse'],
                ['🔔 Informação', 'Saber com quem compartilhamos seus dados'],
              ].map(([icon, desc]) => (
                <div key={icon} className="bg-[#F8F6F2] rounded-xl p-3 text-sm">
                  <strong className="text-[#1C1C2E]">{icon}</strong>
                  <p className="text-[#4A4A5A] mt-1">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm">Para exercer seus direitos: <a href="mailto:privacidade@stylogestor.com.br" className="text-[#1A3A6B] font-semibold hover:underline">privacidade@stylogestor.com.br</a>. Respondemos em até 15 dias úteis.</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">6. Cookies</h2>
            <p className="mb-3">Utilizamos cookies para:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Essenciais</strong> — manter sua sessão ativa (não podem ser desativados)</li>
              <li><strong>Analytics</strong> — entender como o sistema é usado (pode ser recusado)</li>
              <li><strong>Preferências</strong> — lembrar suas configurações</li>
            </ul>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">7. Segurança dos dados</h2>
            <p>Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo: criptografia em trânsito (TLS/HTTPS), criptografia em repouso, controle de acesso baseado em funções, backups automáticos e monitoramento contínuo.</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">8. Retenção de dados</h2>
            <p>Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento, os dados são mantidos por 90 dias (para eventual reativação) e depois excluídos. Dados necessários para compliance fiscal podem ser mantidos por até 5 anos.</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">9. Transferência internacional</h2>
            <p>Alguns de nossos prestadores de serviço (Stripe, Clerk) podem processar dados fora do Brasil. Garantimos que essas transferências são feitas com salvaguardas adequadas conforme a LGPD.</p>
          </section>

          <section className="bg-[#F8F6F2] rounded-xl p-5">
            <h2 className="font-sora font-bold text-lg text-[#1C1C2E] mb-2">Contato — Encarregado de Proteção de Dados (DPO)</h2>
            <p>E-mail: <a href="mailto:privacidade@stylogestor.com.br" className="text-[#1A3A6B] font-semibold hover:underline">privacidade@stylogestor.com.br</a></p>
            <p className="text-sm mt-1">Você também pode registrar reclamações na ANPD (Autoridade Nacional de Proteção de Dados): <a href="https://www.gov.br/anpd" target="_blank" className="text-[#1A3A6B] hover:underline">www.gov.br/anpd</a></p>
          </section>

        </div>
      </main>

      <footer className="bg-[#0d2347] text-white/40 py-8 px-4 text-center text-sm mt-16">
        <p>© 2026 STYLOGESTOR · <Link href="/termos" className="hover:text-white/70">Termos</Link> · <Link href="/privacidade" className="hover:text-white/70">Privacidade</Link></p>
      </footer>
    </div>
  )
}
