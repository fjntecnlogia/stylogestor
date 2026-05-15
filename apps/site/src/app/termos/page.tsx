import { SiteHeader } from '@/components/site-header'
import Link from 'next/link'

export const metadata = { title: 'Termos de Uso — STYLOGESTOR' }

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-10">
          <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-2">Legal</p>
          <h1 className="font-sora font-extrabold text-4xl text-[#1C1C2E] mb-3">Termos de Uso</h1>
          <p className="text-[#4A4A5A]">Última atualização: 15 de maio de 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E6E2] p-8 space-y-8 text-[#4A4A5A] leading-relaxed">

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">1. Aceitação dos Termos</h2>
            <p>Ao acessar e utilizar o STYLOGESTOR ("Sistema"), você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, não utilize o Sistema. O STYLOGESTOR é operado pela FJN Tecnologia Ltda., CNPJ 00.000.000/0001-00, com sede no Brasil.</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">2. Descrição do Serviço</h2>
            <p>O STYLOGESTOR é um sistema de gestão SaaS (Software como Serviço) desenvolvido para barbearias e salões de beleza. O sistema oferece recursos de agenda online, controle financeiro, gestão de clientes, controle de estoque, comissões e relatórios.</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">3. Cadastro e Conta</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Você deve ter pelo menos 18 anos para criar uma conta.</li>
              <li>As informações fornecidas devem ser verídicas e atualizadas.</li>
              <li>Você é responsável por manter a confidencialidade de suas credenciais de acesso.</li>
              <li>Notifique-nos imediatamente em caso de uso não autorizado da sua conta.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">4. Planos e Pagamentos</h2>
            <p className="mb-3">O STYLOGESTOR oferece planos pagos mensalmente ou anualmente. Os preços estão disponíveis na página de planos e podem ser atualizados com aviso prévio de 30 dias.</p>
            <ul className="list-disc list-inside space-y-2">
              <li>O período de trial gratuito é de 14 dias, sem necessidade de cartão de crédito.</li>
              <li>Após o trial, é necessário assinar um plano para continuar usando o sistema.</li>
              <li>Os pagamentos são processados de forma segura via Stripe.</li>
              <li>O cancelamento pode ser feito a qualquer momento, sem multa ou fidelidade.</li>
              <li>Não realizamos reembolsos de períodos já utilizados.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">5. Uso Aceitável</h2>
            <p className="mb-3">É proibido utilizar o STYLOGESTOR para:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Violar qualquer lei ou regulamento aplicável.</li>
              <li>Transmitir conteúdo ilegal, ofensivo ou prejudicial.</li>
              <li>Tentar acessar sistemas ou redes não autorizadas.</li>
              <li>Realizar engenharia reversa ou copiar o software.</li>
              <li>Revender ou sublicenciar o serviço sem autorização expressa.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">6. Propriedade Intelectual</h2>
            <p>Todo o conteúdo, design, código e funcionalidades do STYLOGESTOR são de propriedade exclusiva da FJN Tecnologia Ltda. Você recebe uma licença limitada, não exclusiva e não transferível para usar o sistema conforme estes termos.</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">7. Dados e Privacidade</h2>
            <p>O tratamento dos seus dados pessoais é regido pela nossa <Link href="/privacidade" className="text-[#1A3A6B] font-semibold hover:underline">Política de Privacidade</Link>. Cumprimos integralmente a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">8. Disponibilidade do Serviço</h2>
            <p>Nos comprometemos a manter o sistema disponível 99,5% do tempo (uptime mensal). Manutenções programadas serão comunicadas com antecedência. Não nos responsabilizamos por indisponibilidades causadas por terceiros (internet, energia elétrica, etc.).</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">9. Limitação de Responsabilidade</h2>
            <p>O STYLOGESTOR não se responsabiliza por danos indiretos, incidentais ou consequentes decorrentes do uso ou incapacidade de uso do sistema, incluindo perda de dados, lucros cessantes ou danos comerciais.</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">10. Cancelamento e Rescisão</h2>
            <p>Você pode cancelar sua conta a qualquer momento pelo painel de configurações ou entrando em contato com nosso suporte. Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos.</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">11. Alterações nos Termos</h2>
            <p>Podemos atualizar estes Termos periodicamente. Alterações significativas serão comunicadas por e-mail com pelo menos 15 dias de antecedência. O uso continuado do sistema após as alterações implica aceitação dos novos termos.</p>
          </section>

          <section>
            <h2 className="font-sora font-bold text-xl text-[#1C1C2E] mb-3">12. Foro e Legislação</h2>
            <p>Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida no foro da comarca de São Paulo/SP, com renúncia expressa a qualquer outro.</p>
          </section>

          <section className="bg-[#F8F6F2] rounded-xl p-5">
            <h2 className="font-sora font-bold text-lg text-[#1C1C2E] mb-2">Dúvidas?</h2>
            <p>Entre em contato: <a href="mailto:juridico@stylogestor.com.br" className="text-[#1A3A6B] font-semibold hover:underline">juridico@stylogestor.com.br</a></p>
          </section>

        </div>
      </main>

      <footer className="bg-[#0d2347] text-white/40 py-8 px-4 text-center text-sm mt-16">
        <p>© 2026 STYLOGESTOR · <Link href="/termos" className="hover:text-white/70">Termos</Link> · <Link href="/privacidade" className="hover:text-white/70">Privacidade</Link></p>
      </footer>
    </div>
  )
}
