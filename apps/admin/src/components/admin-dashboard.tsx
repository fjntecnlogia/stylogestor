'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { useToast } from '@/components/ui/toast'

// ── Tipo do tenant vindo da API ──────────────────────────────────
type TenantDB = {
  id: string; name: string; slug: string; plan: string; status: string
  mrr: number; since: string; city: string; clients: number; appts: number
  lastLogin: string; email: string; phone: string; trialEndsAt: string | null
}

// ── Helper localStorage com fallback seguro ──────────────────────
function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}
function saveLS<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// Flag de mocks gated por env (NEXT_PUBLIC_USE_MOCKS=false em prod).
// Em dev (true ou unset) as fixtures aparecem pra navegar a UI; em prod
// todas as listas começam zeradas até o admin cadastrar dados reais ou
// até a API expor os dados via /api/tenants etc.
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false'

const _TENANTS_MOCK = [
  { id: '1', name: 'Barbearia do João',    slug: 'joao-barber',   plan: 'PRO',     status: 'active',   mrr: 149, since: '01/03/2026', city: 'São Paulo',    clients: 148, appts: 312, lastLogin: '11/05/2026', email: 'joao@barbearia.com',    phone: '5511999990001' },
  { id: '2', name: 'Studio Beleza & Cia',  slug: 'studio-beleza', plan: 'PREMIUM', status: 'active',   mrr: 249, since: '15/02/2026', city: 'Curitiba',     clients: 234, appts: 521, lastLogin: '11/05/2026', email: 'contato@studiobeleza.com', phone: '5541999990002' },
  { id: '3', name: 'Barber King',          slug: 'barber-king',   plan: 'STARTER', status: 'active',   mrr: 79,  since: '10/04/2026', city: 'BH',           clients: 67,  appts: 143, lastLogin: '10/05/2026', email: 'rei@barberking.com',    phone: '5531999990003' },
  { id: '4', name: 'Salão da Maria',       slug: 'salao-maria',   plan: 'PRO',     status: 'trial',    mrr: 0,   since: '05/05/2026', city: 'Recife',       clients: 12,  appts: 28,  lastLogin: '11/05/2026', email: 'maria@salao.com',       phone: '5581999990004' },
  { id: '5', name: 'Classic Barber Shop',  slug: 'classic-bs',    plan: 'PRO',     status: 'past_due', mrr: 149, since: '20/01/2026', city: 'Porto Alegre', clients: 89,  appts: 201, lastLogin: '08/05/2026', email: 'classic@barber.com',    phone: '5551999990005' },
  { id: '6', name: 'Espaço Capilar',       slug: 'espaco-cap',    plan: 'STARTER', status: 'canceled', mrr: 0,   since: '01/01/2026', city: 'Fortaleza',    clients: 45,  appts: 98,  lastLogin: '01/04/2026', email: 'espaco@capilar.com',    phone: '5585999990006' },
]
const TENANTS = (USE_MOCKS ? _TENANTS_MOCK : []) as typeof _TENANTS_MOCK

const _TICKETS_INICIAL_MOCK = [
  { id: '1', tenant: 'Barbearia do João',    tipo: 'suporte',    titulo: 'Agendamento duplicado',             status: 'aberto',      data: '11/05/2026', prioridade: 'alta',  resposta: '' },
  { id: '2', tenant: 'Studio Beleza & Cia',  tipo: 'elogio',     titulo: 'Suporte incrível!',                 status: 'resolvido',   data: '10/05/2026', prioridade: 'baixa', resposta: 'Obrigado pelo elogio! Fico feliz que pôde nos ajudar.' },
  { id: '3', tenant: 'Barber King',          tipo: 'reclamacao', titulo: 'WhatsApp não enviando lembretes',   status: 'andamento',   data: '09/05/2026', prioridade: 'alta',  resposta: '' },
  { id: '4', tenant: 'Salão da Maria',       tipo: 'sugestao',   titulo: 'Adicionar relatório semanal',       status: 'aberto',      data: '08/05/2026', prioridade: 'media', resposta: '' },
  { id: '5', tenant: 'Classic Barber Shop',  tipo: 'suporte',    titulo: 'Erro ao fechar caixa',              status: 'andamento',   data: '07/05/2026', prioridade: 'alta',  resposta: '' },
]
const TICKETS_INICIAL = (USE_MOCKS ? _TICKETS_INICIAL_MOCK : []) as typeof _TICKETS_INICIAL_MOCK

const _ANALYTICS_MOCK = {
  pageViews: [420, 380, 510, 490, 620, 580, 710, 680, 750, 820, 790, 940, 1020],
  signups: [2, 1, 3, 2, 4, 2, 3, 5, 3, 4, 6, 4, 5],
  days: ['29/04','30/04','01/05','02/05','03/05','04/05','05/05','06/05','07/05','08/05','09/05','10/05','11/05'],
}
const ANALYTICS = USE_MOCKS ? _ANALYTICS_MOCK : { pageViews: [], signups: [], days: [] }

const STATUS_TENANT = {
  active:   { label: 'Ativo',        cls: 'bg-[#D1FAE5] text-[#065F46]' },
  trial:    { label: 'Trial',        cls: 'bg-[#DBEAFE] text-[#1E40AF]' },
  past_due: { label: 'Inadimplente', cls: 'bg-[#FEE2E2] text-[#991B1B]' },
  canceled: { label: 'Cancelado',    cls: 'bg-[#F3F4F6] text-[#6B7280]' },
}

const STATUS_TICKET = {
  aberto:    { label: 'Aberto',      cls: 'bg-[#FEF9C3] text-[#92400E]' },
  andamento: { label: 'Em andamento',cls: 'bg-[#DBEAFE] text-[#1E40AF]' },
  resolvido: { label: 'Resolvido',   cls: 'bg-[#D1FAE5] text-[#065F46]' },
}

const TIPO_TICKET = {
  suporte:    { icon: '🎧', label: 'Suporte',    color: '#3B82F6' },
  elogio:     { icon: '⭐', label: 'Elogio',     color: '#10B981' },
  reclamacao: { icon: '⚠️', label: 'Reclamação', color: '#EF4444' },
  sugestao:   { icon: '💡', label: 'Sugestão',   color: '#F59E0B' },
}

const PLAN_COLORS: Record<string, string> = { STARTER: '#6B7280', PRO: '#1A3A6B', PREMIUM: '#7C3AED' }

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',    icon: '📊' },
  { id: 'funil',      label: 'Funil & Lançamento', icon: '🚀' },
  { id: 'analytics',  label: 'Analytics',    icon: '📈' },
  { id: 'tenants',    label: 'Barbearias',   icon: '✂️' },
  { id: 'tickets',    label: 'Suporte',      icon: '🎧' },
  { id: 'revenue',    label: 'Receita',      icon: '💰' },
  { id: 'logs',       label: 'Logs',         icon: '📜' },
  { id: 'system',     label: 'Sistema',      icon: '🩺' },
  { id: 'settings',   label: 'Configurações',icon: '⚙️' },
]

// ── DADOS DO FUNIL ──────────────────────────────────────────────
const _FUNIL_STAGES_MOCK = [
  { id: 'visitantes', label: 'Visitantes',  count: 12840, pct: 100, color: '#6B7280', icon: '👁️' },
  { id: 'leads',      label: 'Leads',       count: 1923,  pct: 15,  color: '#3B82F6', icon: '📧' },
  { id: 'trial',      label: 'Trial Ativo', count: 312,   pct: 16,  color: '#F5A623', icon: '⚡' },
  { id: 'assinante',  label: 'Assinante',   count: 87,    pct: 28,  color: '#10B981', icon: '✅' },
  { id: 'premium',    label: 'Upgrade',     count: 34,    pct: 39,  color: '#7C3AED', icon: '💎' },
]
const FUNIL_STAGES = (USE_MOCKS ? _FUNIL_STAGES_MOCK : []) as typeof _FUNIL_STAGES_MOCK

const _LEADS_MOCK = [
  { id: 'L001', nome: 'Carlos Mendes',    email: 'carlos@barbearia.com', cidade: 'São Paulo, SP',     plano: 'PRO',     status: 'trial',    origem: 'Google Ads', data: '11/05/2026', score: 92 },
  { id: 'L002', nome: 'Fernanda Lima',    email: 'fe@studiocabelo.com',  cidade: 'Rio de Janeiro, RJ', plano: 'PREMIUM', status: 'quente',   origem: 'Instagram',  data: '11/05/2026', score: 87 },
  { id: 'L003', nome: 'Rafael Costa',     email: 'rc@barberking.com',    cidade: 'Belo Horizonte, MG', plano: 'PRO',     status: 'quente',   origem: 'Afiliado',   data: '10/05/2026', score: 81 },
  { id: 'L004', nome: 'Juliana Rocha',    email: 'ju@salaorocha.com',    cidade: 'Curitiba, PR',       plano: 'STARTER', status: 'morno',    origem: 'Orgânico',   data: '10/05/2026', score: 65 },
  { id: 'L005', nome: 'Diego Ferreira',   email: 'd@classicbs.com',      cidade: 'Porto Alegre, RS',   plano: 'PRO',     status: 'morno',    origem: 'WhatsApp',   data: '09/05/2026', score: 58 },
  { id: 'L006', nome: 'Mariana Souza',    email: 'ms@estilopm.com',      cidade: 'Fortaleza, CE',      plano: 'STARTER', status: 'frio',     origem: 'Facebook',   data: '08/05/2026', score: 34 },
  { id: 'L007', nome: 'André Oliveira',   email: 'ao@barberapm.com',     cidade: 'Recife, PE',         plano: 'PRO',     status: 'perdido',  origem: 'Google Ads', data: '07/05/2026', score: 12 },
]
const LEADS = (USE_MOCKS ? _LEADS_MOCK : []) as typeof _LEADS_MOCK

const _AUTOMACOES_MOCK = [
  { id: 'A1', nome: 'Boas-vindas Trial',     tipo: 'email',    status: 'ativo',    enviados: 312, abertos: 218, cliques: 89,  conversoes: 34, descricao: 'Email D+0 após cadastro no trial' },
  { id: 'A2', nome: 'Sequência Nurturing',   tipo: 'email',    status: 'ativo',    enviados: 289, abertos: 156, cliques: 67,  conversoes: 28, descricao: 'D+3, D+7, D+10 com dicas de uso' },
  { id: 'A3', nome: 'Urgência Trial D+12',   tipo: 'email',    status: 'ativo',    enviados: 201, abertos: 134, cliques: 78,  conversoes: 41, descricao: 'Email de urgência antes do trial expirar' },
  { id: 'A4', nome: 'WhatsApp Boas-vindas',  tipo: 'whatsapp', status: 'ativo',    enviados: 312, abertos: 298, cliques: 201, conversoes: 67, descricao: 'Mensagem WA logo após cadastro' },
  { id: 'A5', nome: 'WA Follow-up D+5',      tipo: 'whatsapp', status: 'ativo',    enviados: 178, abertos: 165, cliques: 112, conversoes: 38, descricao: 'Pergunta se precisa de ajuda' },
  { id: 'A6', nome: 'Recuperação Churn',     tipo: 'email',    status: 'pausado',  enviados: 45,  abertos: 23,  cliques: 8,   conversoes: 3,  descricao: 'Email para cancelamentos recentes' },
  { id: 'A7', nome: 'Upsell PRO→PREMIUM',    tipo: 'email',    status: 'rascunho', enviados: 0,   abertos: 0,   cliques: 0,   conversoes: 0,  descricao: 'Oferta de upgrade para clientes PRO' },
]
const AUTOMACOES = (USE_MOCKS ? _AUTOMACOES_MOCK : []) as typeof _AUTOMACOES_MOCK

const _AFILIADOS_MOCK = [
  { id: 'AF1', nome: 'João Barber SP',    codigo: 'JOAO10',  comissao: 20, cliques: 342, cadastros: 28, ativos: 18, mrr: 2682, pago: 536.40, pendente: 268.20 },
  { id: 'AF2', nome: 'BarbeirosBR',       codigo: 'BRB15',   comissao: 15, cliques: 891, cadastros: 67, ativos: 41, mrr: 5159, pago: 773.85, pendente: 386.93 },
  { id: 'AF3', nome: 'Estilo Digital',    codigo: 'ESTILO20',comissao: 20, cliques: 234, cadastros: 19, ativos: 12, mrr: 1788, pago: 357.60, pendente: 178.80 },
  { id: 'AF4', nome: 'Rafael Mentor',     codigo: 'RAF10',   comissao: 10, cliques: 156, cadastros: 11, ativos: 7,  mrr: 1043, pago: 104.30, pendente: 52.15 },
]
const AFILIADOS = (USE_MOCKS ? _AFILIADOS_MOCK : []) as typeof _AFILIADOS_MOCK

const _ESTADOS_BR_MOCK = [
  { uf: 'SP', nome: 'São Paulo',          clientes: 23, mrr: 3427, cor: '#1A3A6B' },
  { uf: 'RJ', nome: 'Rio de Janeiro',     clientes: 14, mrr: 2086, cor: '#1A3A6B' },
  { uf: 'MG', nome: 'Minas Gerais',       clientes: 12, mrr: 1788, cor: '#1A3A6B' },
  { uf: 'RS', nome: 'Rio Grande do Sul',  clientes: 9,  mrr: 1341, cor: '#3B82F6' },
  { uf: 'PR', nome: 'Paraná',             clientes: 8,  mrr: 1192, cor: '#3B82F6' },
  { uf: 'BA', nome: 'Bahia',              clientes: 6,  mrr: 894,  cor: '#6B7280' },
  { uf: 'CE', nome: 'Ceará',              clientes: 5,  mrr: 745,  cor: '#6B7280' },
  { uf: 'PE', nome: 'Pernambuco',         clientes: 4,  mrr: 596,  cor: '#6B7280' },
  { uf: 'GO', nome: 'Goiás',              clientes: 3,  mrr: 447,  cor: '#9CA3AF' },
  { uf: 'SC', nome: 'Santa Catarina',     clientes: 3,  mrr: 447,  cor: '#9CA3AF' },
]
const ESTADOS_BR = (USE_MOCKS ? _ESTADOS_BR_MOCK : []) as typeof _ESTADOS_BR_MOCK

const _CAMPANHAS_INICIAL_MOCK = [
  { id: 'C1', nome: 'Google Ads — Barbearia Sistema', canal: 'google', gasto: 1240, cliques: 3420, leads: 312, custo_lead: 3.97, conversoes: 28, cac: 44.28, status: 'ativo' },
  { id: 'C2', nome: 'Meta Ads — Donos de Salão',      canal: 'meta',   gasto: 890,  cliques: 2180, leads: 198, custo_lead: 4.49, conversoes: 19, cac: 46.84, status: 'ativo' },
  { id: 'C3', nome: 'Instagram — Vídeo Depoimento',   canal: 'insta',  gasto: 340,  cliques: 1890, leads: 87,  custo_lead: 3.91, conversoes: 11, cac: 30.91, status: 'ativo' },
  { id: 'C4', nome: 'YouTube — Tutorial Gestão',      canal: 'yt',     gasto: 180,  cliques: 890,  leads: 43,  custo_lead: 4.19, conversoes: 6,  cac: 30.00, status: 'pausado' },
]
const CAMPANHAS_INICIAL = (USE_MOCKS ? _CAMPANHAS_INICIAL_MOCK : []) as typeof _CAMPANHAS_INICIAL_MOCK

const CANAIS_OPCOES = [
  { value: 'google', label: '🔵 Google Ads' },
  { value: 'meta',   label: '🟦 Meta Ads (Facebook)' },
  { value: 'insta',  label: '🩷 Instagram' },
  { value: 'yt',     label: '🔴 YouTube' },
  { value: 'outros', label: '⚫ Outros' },
]

export function AdminDashboard() {
  const { user } = useUser()
  const { success: toastSuccess, error: toastError, info: toastInfo, warning: toastWarning } = useToast()
  const adminEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? ''
  const adminName = user?.firstName || adminEmail.split('@')[0] || 'Admin'
  const [page, setPage] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [ticketFiltro, setTicketFiltro] = useState<'todos' | 'aberto' | 'andamento' | 'resolvido'>('todos')
  const [selectedTicket, setSelectedTicket] = useState<typeof TICKETS_INICIAL[0] | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<typeof TENANTS[0] | null>(null)
  const [resposta, setResposta] = useState('')
  const [ticketResolvido, setTicketResolvido] = useState<string | null>(null)

  // ── Estados persistidos no localStorage ─────────────────────────
  const [tenants, setTenants] = useState(() => loadLS('sg_tenants', TENANTS))
  const [tickets, setTickets] = useState(() => loadLS('sg_tickets', TICKETS_INICIAL))
  const [campanhas, setCampanhas] = useState(() => loadLS('sg_campanhas', CAMPANHAS_INICIAL))
  const [automacoes, setAutomacoes] = useState(() => loadLS('sg_automacoes', AUTOMACOES))
  const [afiliados, setAfiliados] = useState(() => loadLS('sg_afiliados', AFILIADOS))
  const [tenantsSuspended, setTenantsSuspended] = useState<string[]>(() => loadLS('sg_suspended', []))
  // Planos editáveis (config do SaaS — persistidos via sg_plans)
  const [plans, setPlans] = useState<Array<{ id: string; name: string; priceMonthly: number; profLimit: number }>>(
    () => loadLS('sg_plans', [
      { id: 'starter', name: 'Starter', priceMonthly: 79,  profLimit: 1 },
      { id: 'pro',     name: 'Pro',     priceMonthly: 149, profLimit: 5 },
      { id: 'premium', name: 'Premium', priceMonthly: 249, profLimit: -1 },
    ]),
  )
  // Notas internas por tenant — { [tenantId]: 'texto da nota' }
  const [tenantNotes, setTenantNotes] = useState<Record<string, string>>(
    () => loadLS('sg_tenant_notes', {}),
  )
  const [noteDraft, setNoteDraft] = useState('')

  // Sincronizar com localStorage sempre que mudam
  useEffect(() => { saveLS('sg_tickets', tickets) }, [tickets])
  useEffect(() => { saveLS('sg_campanhas', campanhas) }, [campanhas])
  useEffect(() => { saveLS('sg_automacoes', automacoes) }, [automacoes])
  useEffect(() => { saveLS('sg_afiliados', afiliados) }, [afiliados])
  useEffect(() => { saveLS('sg_suspended', tenantsSuspended) }, [tenantsSuspended])
  useEffect(() => { saveLS('sg_plans', plans) }, [plans])
  useEffect(() => { saveLS('sg_tenant_notes', tenantNotes) }, [tenantNotes])
  // Quando troca de tenant na visualização detalhada, prefilla o draft da
  // nota com o valor já salvo. Sem isso o textarea preserva texto entre
  // tenants e o gestor pode salvar a nota da barbearia X dentro da Y.
  useEffect(() => {
    if (selectedTenant) setNoteDraft(tenantNotes[selectedTenant.id] ?? '')
    else setNoteDraft('')
    // tenantNotes intencionalmente fora das deps: queremos só sincronizar
    // no momento da troca de tenant, não a cada salvamento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant?.id])

  // ── Buscar tenants REAIS do banco ────────────────────────────────
  const [dbStats, setDbStats] = useState({ totalMRR: 0, active: 0, trials: 0, totalClients: 0, totalAppts: 0 })
  const [loadingDB, setLoadingDB] = useState(true)

  useEffect(() => {
    // Buscar tenants reais
    fetch('/api/tenants')
      .then(r => r.json())
      .then((dbTenants: TenantDB[]) => {
        if (Array.isArray(dbTenants) && dbTenants.length > 0) {
          // Mesclar DB com mock: DB primeiro, depois mocks que não estão no DB
          const dbIds = new Set(dbTenants.map(t => t.slug))
          const mockOnly = TENANTS.filter(t => !dbIds.has(t.slug))
          setTenants([...dbTenants, ...mockOnly])
          saveLS('sg_tenants', [...dbTenants, ...mockOnly])
        }
        setLoadingDB(false)
      })
      .catch(() => setLoadingDB(false))

    // Buscar stats reais
    fetch('/api/stats')
      .then(r => r.json())
      .then(s => { if (!s.error) setDbStats(s) })
      .catch(() => {})

    // Carregar settings do SaaS
    fetch('/api/saas-settings/trial-days')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: { days?: number }) => {
        if (typeof d?.days === 'number') {
          setDefaultTrialDays(d.days)
          setTrialDaysDraft(String(d.days))
        }
      })
      .catch(() => {})
    fetch('/api/saas-settings/promo-codes')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((codes) => Array.isArray(codes) && setPromoCodes(codes))
      .catch(() => {})
  }, [])

  // Handlers de settings/promo/trial declarados mais abaixo (depois dos
  // states que eles dependem — TS exige declaração antes de uso).

  // ── Estados de UI (não precisam persistir) ───────────────────────
  const [novaCampanhaOpen, setNovaCampanhaOpen] = useState(false)
  const [formCampanha, setFormCampanha] = useState({ nome: '', canal: 'google', orcamento: '', objetivo: 'leads' })
  const [selectedLead, setSelectedLead] = useState<typeof LEADS[0] | null>(null)
  const [novaAutomacaoOpen, setNovaAutomacaoOpen] = useState(false)
  const [formAutomacao, setFormAutomacao] = useState({ nome: '', tipo: 'email', gatilho: 'cadastro', delay: '0', mensagem: '' })
  const [selectedAutomacao, setSelectedAutomacao] = useState<typeof AUTOMACOES[0] | null>(null)
  const [editAutomacao, setEditAutomacao] = useState({ nome: '', descricao: '' })
  const [selectedAfiliado, setSelectedAfiliado] = useState<typeof AFILIADOS[0] | null>(null)
  const [novoAfiliadoOpen, setNovoAfiliadoOpen] = useState(false)
  const [formAfiliado, setFormAfiliado] = useState({ nome: '', email: '', codigo: '', comissao: 15 })
  const [selectedCampanha, setSelectedCampanha] = useState<typeof CAMPANHAS_INICIAL[0] | null>(null)
  const [editCampanha, setEditCampanha] = useState({ nome: '', gasto: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cobrancaEnviada, setCobrancaEnviada] = useState<string | null>(null)
  const [suspenderConfirm, setSuspenderConfirm] = useState(false)
  const [tenantTab, setTenantTab] = useState<'overview'|'financeiro'|'atividade'|'suporte'>('overview')
  const [novoTenantOpen, setNovoTenantOpen] = useState(false)
  const [formTenant, setFormTenant] = useState({ name: '', email: '', phone: '', city: '', plan: 'PRO', slug: '' })
  // Modal de edição de plano (config > planos e preços)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planDraft, setPlanDraft] = useState<{ name: string; priceMonthly: number; profLimit: number }>({
    name: '', priceMonthly: 0, profLimit: 1,
  })
  // Modal de excluir barbearia (hard delete — destrutivo, exige digitar o nome)
  const [excluirTenant, setExcluirTenant] = useState<typeof tenants[0] | null>(null)
  const [excluirConfirmText, setExcluirConfirmText] = useState('')
  const [excluindoLoading, setExcluindoLoading] = useState(false)
  // Estado de carregamento do cancelar (PATCH soft delete)
  const [cancelandoLoading, setCancelandoLoading] = useState<string | null>(null)
  // ── Configurações SaaS (vindas do banco via /api/saas-settings/*) ──
  // trial-days: dias padrão de trial pra novos tenants
  const [defaultTrialDays, setDefaultTrialDays] = useState<number>(14)
  const [trialDaysDraft, setTrialDaysDraft] = useState<string>('14')
  const [savingTrialDays, setSavingTrialDays] = useState(false)
  // promo-codes: lista + form de criar
  interface PromoCode {
    id: string; code: string; description: string; trialDays: number
    active: boolean; usageLimit: number | null; usedCount: number; expiresAt: string | null
  }
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [novoPromoForm, setNovoPromoForm] = useState({ code: '', description: '', trialDays: 30, usageLimit: '' })
  const [creatingPromo, setCreatingPromo] = useState(false)
  // Modal de estender trial / aplicar código (no detalhe do tenant)
  const [trialModalTenant, setTrialModalTenant] = useState<typeof tenants[0] | null>(null)
  const [trialModalTab, setTrialModalTab] = useState<'days' | 'date' | 'code'>('days')
  const [trialExtendDays, setTrialExtendDays] = useState<string>('15')
  const [trialNewDate, setTrialNewDate] = useState<string>('')
  const [trialPromoCode, setTrialPromoCode] = useState<string>('')
  const [trialModalLoading, setTrialModalLoading] = useState(false)
  // Modal de histórico de resgates de um código promocional
  interface Redemption {
    id: string; tenantId: string; tenantName: string; tenantSlug: string | null
    trialDays: number; appliedAt: string
  }
  const [redemptionsCode, setRedemptionsCode] = useState<PromoCode | null>(null)
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [redemptionsLoading, setRedemptionsLoading] = useState(false)

  // ── LOGS (aba 'logs') ─────────────────────────────────────────────
  interface SystemLogItem {
    id: string
    level: 'info' | 'warn' | 'error' | 'debug'
    source: string
    message: string
    context: unknown
    tenantId: string | null
    createdAt: string
  }
  const [logs, setLogs] = useState<SystemLogItem[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logFilterLevel, setLogFilterLevel] = useState<'' | 'info' | 'warn' | 'error' | 'debug'>('')
  const [logFilterSource, setLogFilterSource] = useState<string>('')
  const [logExpanded, setLogExpanded] = useState<string | null>(null)
  const [logNextCursor, setLogNextCursor] = useState<string | null>(null)
  const [logCleanupBusy, setLogCleanupBusy] = useState(false)

  // ── SISTEMA (aba 'system') ────────────────────────────────────────
  // Estado por app. Apps são fixos no front; o backend de cada um expõe /api/health
  // retornando { ok, version, buildTime, name }.
  interface AppHealth {
    name: string
    url: string         // URL base do app (sem /api/health)
    ok: boolean | null  // null = ainda não checado, false = erro
    version?: string
    buildTime?: string
    httpStatus?: number
    error?: string
    latencyMs?: number
  }
  // Apps que expõem /api/health pra esse painel pingar.
  // Mobile não tem URL pública (é app nativo) — fica de fora.
  const APPS_TO_MONITOR: { name: string; url: string }[] = [
    { name: 'Web (gestor)',  url: 'https://app.stylogestor.com.br' },
    { name: 'Site público',  url: 'https://stylogestor.com.br' },
    { name: 'Booking',       url: 'https://book.stylogestor.com.br' },
    { name: 'Admin (este)',  url: 'https://admin.stylogestor.com.br' },
  ]
  const [appsHealth, setAppsHealth] = useState<AppHealth[]>(
    APPS_TO_MONITOR.map((a) => ({ ...a, ok: null })),
  )
  const [healthLoading, setHealthLoading] = useState(false)

  // ── Handlers de settings/promo/trial (depois dos states) ──────────

  // Salvar trial-days global
  const handleSaveTrialDays = useCallback(async () => {
    const n = Number(trialDaysDraft)
    if (!Number.isFinite(n) || n < 0 || n > 365) {
      toastWarning('Digite um número entre 0 e 365.')
      return
    }
    setSavingTrialDays(true)
    try {
      const res = await fetch('/api/saas-settings/trial-days', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: n }),
      })
      const data = await res.json()
      if (!res.ok) { toastError(`Erro: ${data.error ?? res.statusText}`); return }
      setDefaultTrialDays(data.days)
      toastSuccess(`Trial padrão salvo: ${data.days} dias`)
    } catch (err) {
      toastError('Erro de rede ao salvar')
      console.error(err)
    } finally {
      setSavingTrialDays(false)
    }
  }, [trialDaysDraft, toastSuccess, toastError, toastWarning])

  // Criar novo código promocional
  const handleCreatePromo = useCallback(async () => {
    if (!novoPromoForm.code.trim() || novoPromoForm.trialDays <= 0) {
      toastWarning('Código e dias de trial são obrigatórios')
      return
    }
    setCreatingPromo(true)
    try {
      const res = await fetch('/api/saas-settings/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: novoPromoForm.code,
          description: novoPromoForm.description || undefined,
          trialDays: novoPromoForm.trialDays,
          usageLimit: novoPromoForm.usageLimit ? Number(novoPromoForm.usageLimit) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toastError(`Erro: ${data.error ?? res.statusText}`); return }
      setPromoCodes((prev) => [data, ...prev])
      const codeCreated = data.code
      setNovoPromoForm({ code: '', description: '', trialDays: 30, usageLimit: '' })
      toastSuccess(`Código ${codeCreated} criado!`)
    } catch (err) {
      toastError('Erro de rede ao criar código')
      console.error(err)
    } finally {
      setCreatingPromo(false)
    }
  }, [novoPromoForm, toastSuccess, toastError, toastWarning])

  // Desativar/ativar código promocional
  const handleTogglePromo = useCallback(async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/saas-settings/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      const data = await res.json()
      if (!res.ok) { toastError(`Erro: ${data.error ?? res.statusText}`); return }
      setPromoCodes((prev) => prev.map((p) => (p.id === id ? { ...p, active: data.active } : p)))
      toastInfo(active ? 'Código reativado' : 'Código desativado')
    } catch (err) {
      toastError('Erro de rede')
      console.error(err)
    }
  }, [toastError, toastInfo])

  // Abre modal de histórico de resgates de um código
  const handleOpenRedemptions = useCallback(async (promo: PromoCode) => {
    setRedemptionsCode(promo)
    setRedemptions([])
    setRedemptionsLoading(true)
    try {
      const res = await fetch(`/api/saas-settings/promo-codes/${promo.id}/redemptions`)
      const data = await res.json()
      if (!res.ok) {
        toastError(data.error || 'Erro ao buscar histórico')
        return
      }
      setRedemptions(Array.isArray(data) ? data : [])
    } catch (err) {
      toastError('Erro de rede')
      console.error(err)
    } finally {
      setRedemptionsLoading(false)
    }
  }, [toastError])

  // Deletar código promocional
  const handleDeletePromo = useCallback(async (id: string, code: string) => {
    if (!confirm(`Excluir o código "${code}"?`)) return
    try {
      const res = await fetch(`/api/saas-settings/promo-codes/${id}`, { method: 'DELETE' })
      if (!res.ok) { toastError('Erro ao excluir código'); return }
      setPromoCodes((prev) => prev.filter((p) => p.id !== id))
      toastSuccess(`Código ${code} excluído`)
    } catch (err) {
      toastError('Erro de rede')
      console.error(err)
    }
  }, [toastError, toastSuccess])

  // Aplicar mudança de trial no tenant (a partir do modal)
  const handleApplyTrialChange = useCallback(async () => {
    if (!trialModalTenant) return
    setTrialModalLoading(true)
    try {
      let body: Record<string, unknown> = {}
      if (trialModalTab === 'days') {
        body = { action: 'extendTrialDays', days: Number(trialExtendDays) }
      } else if (trialModalTab === 'date') {
        if (!trialNewDate) { toastWarning('Escolha uma data'); setTrialModalLoading(false); return }
        body = { action: 'setTrialEndsAt', date: trialNewDate }
      } else {
        if (!trialPromoCode.trim()) { toastWarning('Digite o código'); setTrialModalLoading(false); return }
        body = { action: 'applyPromoCode', code: trialPromoCode }
      }

      const res = await fetch(`/api/tenants/${trialModalTenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { toastError(`Erro: ${data.error ?? res.statusText}`); return }

      const msg = trialModalTab === 'code'
        ? `Código ${data.code} aplicado! +${data.trialDaysAdded} dias.`
        : `Trial atualizado. Novo fim: ${new Date(data.trialEndsAt).toLocaleDateString('pt-BR')}`
      toastSuccess(msg)
      setTrialModalTenant(null)
      setTrialExtendDays('15')
      setTrialNewDate('')
      setTrialPromoCode('')
    } catch (err) {
      toastError('Erro de rede')
      console.error(err)
    } finally {
      setTrialModalLoading(false)
    }
  }, [trialModalTenant, trialModalTab, trialExtendDays, trialNewDate, trialPromoCode, toastSuccess, toastError, toastWarning])

  // ── Logs: buscar com filtros + paginação ───────────────────────────
  const fetchLogs = useCallback(async (opts?: { append?: boolean }) => {
    setLogsLoading(true)
    try {
      const qs = new URLSearchParams()
      if (logFilterLevel) qs.set('level', logFilterLevel)
      if (logFilterSource.trim()) qs.set('source', logFilterSource.trim())
      qs.set('limit', '100')
      if (opts?.append && logNextCursor) qs.set('cursor', logNextCursor)
      const res = await fetch(`/api/logs?${qs.toString()}`)
      const data = await res.json()
      if (!res.ok) {
        toastError(data.error || 'Erro ao buscar logs')
        return
      }
      const items: SystemLogItem[] = Array.isArray(data.items) ? data.items : []
      setLogs((prev) => (opts?.append ? [...prev, ...items] : items))
      setLogNextCursor(data.nextCursor ?? null)
    } catch (err) {
      toastError('Erro de rede ao buscar logs')
      console.error(err)
    } finally {
      setLogsLoading(false)
    }
  }, [logFilterLevel, logFilterSource, logNextCursor, toastError])

  // Limpar logs antigos (botão "Limpar > 30 dias")
  const handleCleanupLogs = useCallback(async () => {
    if (!confirm('Apagar logs com mais de 30 dias? Essa ação não pode ser desfeita.')) return
    setLogCleanupBusy(true)
    try {
      const res = await fetch('/api/logs?olderThanDays=30', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toastError(data.error || 'Erro ao limpar'); return }
      toastSuccess(`${data.deleted ?? 0} log(s) apagado(s)`)
      // recarrega lista zerando cursor
      setLogNextCursor(null)
      await fetchLogs()
    } catch (err) {
      toastError('Erro de rede')
      console.error(err)
    } finally {
      setLogCleanupBusy(false)
    }
  }, [fetchLogs, toastError, toastSuccess])

  // Carrega logs ao trocar pra aba logs ou mudar filtro
  useEffect(() => {
    if (page !== 'logs') return
    // setState dentro de effect é necessário aqui — não é cascading render,
    // é resposta a mudança de filtro (input externo do usuário).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLogNextCursor(null)
    fetchLogs()
    // fetchLogs intencionalmente fora — queremos refetch só ao trocar filtro
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, logFilterLevel, logFilterSource])

  // ── Sistema: pingar health de cada app ─────────────────────────────
  const refreshHealth = useCallback(async () => {
    setHealthLoading(true)
    try {
      const results = await Promise.all(
        APPS_TO_MONITOR.map(async ({ name, url }) => {
          const started = performance.now()
          try {
            const res = await fetch(`${url}/api/health`, {
              method: 'GET',
              cache: 'no-store',
              headers: { Accept: 'application/json' },
            })
            const latency = Math.round(performance.now() - started)
            if (!res.ok) {
              return { name, url, ok: false, httpStatus: res.status, latencyMs: latency } as AppHealth
            }
            const data: { version?: string; buildTime?: string } = await res.json().catch(() => ({}))
            return {
              name,
              url,
              ok: true,
              version: data.version,
              buildTime: data.buildTime,
              httpStatus: res.status,
              latencyMs: latency,
            } as AppHealth
          } catch (err) {
            return {
              name,
              url,
              ok: false,
              error: err instanceof Error ? err.message : 'erro de rede',
              latencyMs: Math.round(performance.now() - started),
            } as AppHealth
          }
        }),
      )
      setAppsHealth(results)
    } finally {
      setHealthLoading(false)
    }
  // APPS_TO_MONITOR é constante por render — referencia mas não muda
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh ao abrir aba sistema
  useEffect(() => {
    if (page !== 'system') return
    // refreshHealth interno faz setAppsHealth — é cascading benéfico
    // (ping inicial ao abrir a aba). Sem effect, a aba abriria sem dados.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshHealth()
  }, [page, refreshHealth])

  // Helper de label do limite de profissionais por plano
  const planLimitLabel = (n: number) =>
    n === -1 ? 'Ilimitado' : `${n} profissional${n === 1 ? '' : 'is'}`

  // ── Derivados — usa DB quando disponível, fallback para local ────
  const active   = tenants.filter((t) => t.status === 'active')
  const trials   = tenants.filter((t) => t.status === 'trial')
  const pastDue  = tenants.filter((t) => t.status === 'past_due')
  const totalMRR = dbStats.totalMRR || [...active, ...pastDue].reduce((s, t) => s + t.mrr, 0)
  const totalClients = dbStats.totalClients || tenants.reduce((s, t) => s + t.clients, 0)
  const totalAppts = dbStats.totalAppts || tenants.reduce((s, t) => s + t.appts, 0)

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.city.toLowerCase().includes(search.toLowerCase())
  )

  const filteredTickets = tickets.filter((t) =>
    ticketFiltro === 'todos' || t.status === ticketFiltro
  )

  const ticketsAbertos = tickets.filter((t) => t.status === 'aberto').length

  const maxPageView = Math.max(...ANALYTICS.pageViews)

  // Adicionar novo tenant
  const handleAdicionarTenant = useCallback(() => {
    if (!formTenant.name || !formTenant.email) return
    const PLAN_MRR: Record<string, number> = { STARTER: 79, PRO: 149, PREMIUM: 249 }
    const slug = formTenant.slug || formTenant.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 20)
    const newTenant = {
      id: String(Date.now()),
      name: formTenant.name,
      slug,
      plan: formTenant.plan,
      status: 'trial' as const,
      mrr: 0,
      since: new Date().toLocaleDateString('pt-BR'),
      city: formTenant.city || '—',
      clients: 0,
      appts: 0,
      lastLogin: new Date().toLocaleDateString('pt-BR'),
      email: formTenant.email,
      phone: formTenant.phone.replace(/\D/g, '') || '5500000000000',
    }
    setTenants(prev => [newTenant, ...prev])
    setFormTenant({ name: '', email: '', phone: '', city: '', plan: 'PRO', slug: '' })
    setNovoTenantOpen(false)
  }, [formTenant])

  // Cancelar barbearia (soft delete — atualiza banco via PATCH).
  // Mantém o tenant no estado local com status='canceled' pra reaparecer
  // na lista marcado como cancelado.
  const handleCancelarTenant = useCallback(async (tenantId: string, tenantName: string) => {
    if (!confirm(`Cancelar a assinatura de "${tenantName}"?\n\nA barbearia fica marcada como cancelada e o gestor perde acesso. Dados ficam no banco — você pode reativar depois.`)) return
    setCancelandoLoading(tenantId)
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toastError(`Erro ao cancelar: ${err.error ?? res.statusText}`)
        return
      }
      setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, status: 'canceled', mrr: 0 } : t)))
      toastSuccess(`${tenantName} cancelada`)
    } catch (err) {
      toastError('Erro de rede ao cancelar')
      console.error(err)
    } finally {
      setCancelandoLoading(null)
    }
  }, [toastSuccess, toastError])

  // Reativar tenant cancelado
  const handleReativarTenant = useCallback(async (tenantId: string, tenantName: string) => {
    if (!confirm(`Reativar "${tenantName}"?`)) return
    setCancelandoLoading(tenantId)
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toastError(`Erro ao reativar: ${err.error ?? res.statusText}`)
        return
      }
      setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, status: 'active' } : t)))
      toastSuccess(`${tenantName} reativada`)
    } catch (err) {
      toastError('Erro de rede ao reativar')
      console.error(err)
    } finally {
      setCancelandoLoading(null)
    }
  }, [toastSuccess, toastError])

  // Excluir barbearia (hard delete — apaga do banco, sem volta).
  // Confirmação dupla via modal pedindo pra digitar o nome exato.
  const handleExcluirTenant = useCallback(async () => {
    if (!excluirTenant) return
    if (excluirConfirmText !== excluirTenant.name) {
      toastWarning('O nome digitado não bate. Confira e tente de novo.')
      return
    }
    setExcluindoLoading(true)
    try {
      const res = await fetch(
        `/api/tenants/${excluirTenant.id}?confirmName=${encodeURIComponent(excluirTenant.name)}`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toastError(`Erro ao excluir: ${err.error ?? res.statusText}`)
        return
      }
      const id = excluirTenant.id
      const deletedName = excluirTenant.name
      setTenants((prev) => prev.filter((t) => t.id !== id))
      setExcluirTenant(null)
      setExcluirConfirmText('')
      setSelectedTenant(null)
      setPage('tenants')
      toastSuccess(`${deletedName} excluída permanentemente`)
    } catch (err) {
      toastError('Erro de rede ao excluir')
      console.error(err)
    } finally {
      setExcluindoLoading(false)
    }
  }, [excluirTenant, excluirConfirmText, toastSuccess, toastError, toastWarning])

  const handleNav = (id: string) => { setPage(id); setSidebarOpen(false) }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A]">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        w-56 bg-[#0F172A] border-r border-white/5 flex flex-col shrink-0
        fixed lg:sticky top-0 h-screen z-40 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-5 py-5 border-b border-white/5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-7 h-7 bg-[#F5A623] rounded-lg flex items-center justify-center font-sora font-black text-[#1A3A6B] text-sm">S</div>
              <span className="font-sora font-extrabold text-white text-sm">STYLOGESTOR</span>
            </div>
            <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-widest">Admin SaaS</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white text-lg mt-0.5">✕</button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <button key={item.id} onClick={() => handleNav(item.id)}
              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                page === item.id ? 'bg-white/10 text-white font-semibold' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'tickets' && ticketsAbertos > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{ticketsAbertos}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5 space-y-2">
          {/* Badge banco de dados */}
          <div className={`rounded-xl px-3 py-2 text-center ${loadingDB ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
            <p className="text-[10px] font-bold" style={{ color: loadingDB ? '#F5A623' : '#10B981' }}>
              {loadingDB ? '⏳ Carregando BD...' : '🗄️ PostgreSQL conectado'}
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">{tenants.length} barbearias</p>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8 ring-2 ring-[#F5A623]/30',
                  userButtonPopoverCard: 'bg-[#1C2333] border border-white/10',
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{adminName}</p>
              <p className="text-[10px] text-white/40 truncate" title={adminEmail}>
                {adminEmail || 'Super Admin'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="block w-5 h-0.5 bg-white rounded" />
            <span className="block w-5 h-0.5 bg-white rounded" />
            <span className="block w-5 h-0.5 bg-white rounded" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#F5A623] rounded flex items-center justify-center font-sora font-black text-[#1A3A6B] text-xs">S</div>
            <span className="font-sora font-extrabold text-white text-sm">STYLOGESTOR <span className="text-[#F5A623] text-[10px]">ADMIN</span></span>
          </div>
          {ticketsAbertos > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{ticketsAbertos} aberto{ticketsAbertos > 1 ? 's' : ''}</span>
          )}
        </div>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-6">

          {/* ── FUNIL & LANÇAMENTO ── */}
          {page === 'funil' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h1 className="font-sora font-bold text-2xl text-white">🚀 Funil & Lançamento Brasil</h1>
                  <p className="text-white/40 text-sm mt-0.5">Visão completa da máquina de vendas automática</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setNovaCampanhaOpen(true)} className="bg-[#F5A623] text-[#1A3A6B] font-bold text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">+ Nova Campanha</button>
                  <button
                    onClick={() => {
                      // CSV deriva dos stages atuais (vazio em prod até existir analytics real)
                      const header = 'Visitantes,Leads,Trials,Assinantes'
                      const v = FUNIL_STAGES.find((s) => s.id === 'visitantes')?.count ?? 0
                      const l = FUNIL_STAGES.find((s) => s.id === 'leads')?.count ?? 0
                      const t = FUNIL_STAGES.find((s) => s.id === 'trial')?.count ?? trials.length
                      const a = FUNIL_STAGES.find((s) => s.id === 'assinante')?.count ?? active.length
                      const d = `${header}\n${v},${l},${t},${a}`
                      const b = new Blob([d], { type: 'text/csv' })
                      const u = URL.createObjectURL(b)
                      const link = document.createElement('a')
                      link.href = u; link.download = 'funil.csv'; link.click()
                    }}
                    className="bg-white/10 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-white/15 transition-colors"
                  >
                    📤 Exportar CSV
                  </button>
                </div>
              </div>

              {/* KPIs do Funil — em modo demo usa nros fakes pra preview; em prod
                  deriva dos dados reais (tenants/leads) ou mostra "—" pra quem
                  ainda não tem analytics plugado. */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Visitantes/mês',   value: USE_MOCKS ? '12.840' : '—',                              sub: USE_MOCKS ? '▲ 34%' : 'sem dados', color: '#6B7280', icon: '👁️' },
                  { label: 'Leads capturados', value: USE_MOCKS ? '1.923'  : String(LEADS.length),             sub: USE_MOCKS ? '▲ 28%' : 'capturados',  color: '#3B82F6', icon: '📧' },
                  { label: 'Trials ativos',    value: USE_MOCKS ? '312'    : String(trials.length),            sub: USE_MOCKS ? '▲ 21%' : 'em trial',    color: '#F5A623', icon: '⚡' },
                  { label: 'Assinantes',       value: USE_MOCKS ? '87'     : String(active.length),            sub: USE_MOCKS ? '▲ 15%' : 'ativos',      color: '#10B981', icon: '✅' },
                  { label: 'CAC médio',        value: USE_MOCKS ? 'R$41'   : '—',                              sub: USE_MOCKS ? 'meta R$50' : 'sem dados', color: '#A78BFA', icon: '🎯' },
                  { label: 'LTV estimado',     value: USE_MOCKS ? 'R$2.1k' : '—',                              sub: USE_MOCKS ? '14 meses' : 'sem dados',  color: '#F59E0B', icon: '💎' },
                ].map((k) => (
                  <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="text-xl mb-2">{k.icon}</div>
                    <p className="font-sora font-extrabold text-xl" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-[10px] text-white/40 font-medium mt-0.5">{k.label}</p>
                    <p className="text-[10px] font-bold mt-1" style={{ color: k.color }}>{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Funil Visual */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-sora font-bold text-white mb-6">📊 Funil de Conversão</h3>
                {FUNIL_STAGES.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-5xl mb-3">📊</p>
                    <p className="font-sora font-bold text-white">Sem dados de funil ainda</p>
                    <p className="text-xs text-white/40 mt-1">
                      Quando a integração de analytics chegar (Google/Meta), o funil vai aparecer aqui.
                    </p>
                  </div>
                ) : (
                <div className="space-y-3">
                  {FUNIL_STAGES.map((stage, i) => {
                    const prev = i > 0 ? FUNIL_STAGES[i-1] : null
                    const dropPct = prev ? Math.round((1 - stage.count / prev.count) * 100) : null
                    return (
                      <div key={stage.id} className="relative">
                        {dropPct !== null && (
                          <div className="flex items-center gap-2 mb-1 ml-4">
                            <span className="text-[10px] text-white/30">↓ abandono</span>
                            <span className="text-[10px] font-bold text-red-400">{dropPct}%</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <div className="w-8 text-center text-lg">{stage.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-semibold text-white">{stage.label}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-white/60">{stage.count.toLocaleString()}</span>
                                {i > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: stage.color + '20', color: stage.color }}>{stage.pct}% conv.</span>}
                              </div>
                            </div>
                            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${stage.count / 12840 * 100}%`, background: stage.color }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                )}
                {FUNIL_STAGES.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-xs text-white/40">Conversão Total</p><p className="font-sora font-bold text-white text-lg">{USE_MOCKS ? '0,68%' : '—'}</p></div>
                    <div><p className="text-xs text-white/40">Taxa Trial→Pago</p><p className="font-sora font-bold text-[#10B981] text-lg">{USE_MOCKS ? '27,9%' : '—'}</p></div>
                    <div><p className="text-xs text-white/40">Tempo médio trial</p><p className="font-sora font-bold text-[#F5A623] text-lg">{USE_MOCKS ? '9,3 dias' : '—'}</p></div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Leads recentes com score */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-sora font-bold text-white">🔥 Leads Recentes</h3>
                    <span className="text-xs text-white/40">{LEADS.length} leads ativos</span>
                  </div>
                  {LEADS.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-4xl mb-2">🔥</p>
                      <p className="font-sora font-bold text-white text-sm">Nenhum lead capturado ainda</p>
                      <p className="text-[10px] text-white/40 mt-1">Quando o módulo de leads/marketing estiver plugado, eles aparecem aqui.</p>
                    </div>
                  ) : (
                  <div className="space-y-2">
                    {LEADS.map((l) => {
                      const statusCor: Record<string, string> = { quente: '#EF4444', morno: '#F59E0B', frio: '#6B7280', trial: '#3B82F6', perdido: '#374151' }
                      const statusLabel: Record<string, string> = { quente: '🔴 Quente', morno: '🟡 Morno', frio: '🔵 Frio', trial: '⚡ Trial', perdido: '❌ Perdido' }
                      return (
                        <div key={l.id} onClick={() => setSelectedLead(selectedLead?.id === l.id ? null : l)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white text-sm shrink-0">{l.nome.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white truncate">{l.nome}</p>
                              <span className="text-[10px] font-bold shrink-0" style={{ color: statusCor[l.status] }}>{statusLabel[l.status]}</span>
                            </div>
                            <p className="text-xs text-white/40 truncate">{l.cidade} · {l.origem}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold" style={{ borderColor: l.score > 70 ? '#10B981' : l.score > 40 ? '#F59E0B' : '#6B7280', color: l.score > 70 ? '#10B981' : l.score > 40 ? '#F59E0B' : '#6B7280' }}>{l.score}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  )}
                </div>

                {/* Performance por estado */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-sora font-bold text-white">🗺️ Brasil — Por Estado</h3>
                    <span className="text-xs text-white/40">Top 10 estados</span>
                  </div>
                  {ESTADOS_BR.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-4xl mb-2">🗺️</p>
                      <p className="font-sora font-bold text-white text-sm">Sem distribuição geográfica ainda</p>
                      <p className="text-[10px] text-white/40 mt-1">Aparece conforme as barbearias cadastram cidade.</p>
                    </div>
                  ) : (
                  <>
                  <div className="space-y-2">
                    {ESTADOS_BR.map((e, i) => {
                      const maxClientes = Math.max(...ESTADOS_BR.map((s) => s.clientes), 1)
                      return (
                      <div key={e.uf} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white/30 w-4 text-right">{i+1}</span>
                        <span className="font-bold text-white text-sm w-8">{e.uf}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${e.clientes / maxClientes * 100}%`, background: '#1A3A6B' }} />
                        </div>
                        <span className="text-xs text-white/60 w-6 text-right font-semibold">{e.clientes}</span>
                        <span className="text-xs font-bold text-[#10B981] w-20 text-right">R${e.mrr.toLocaleString()}</span>
                      </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-xs text-white/40">
                    <span>{ESTADOS_BR.reduce((s, e) => s + e.clientes, 0)} clientes em {ESTADOS_BR.length} estados</span>
                    <span className="font-bold text-[#10B981]">MRR Total: R${ESTADOS_BR.reduce((s, e) => s + e.mrr, 0).toLocaleString()}</span>
                  </div>
                  </>
                  )}
                </div>
              </div>

              {/* Automações */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-sora font-bold text-white">⚙️ Automações Ativas</h3>
                  <button onClick={() => setNovaAutomacaoOpen(true)} className="text-xs bg-[#F5A623] text-[#1A3A6B] font-bold px-3 py-1.5 rounded-lg hover:opacity-90">+ Nova automação</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/30 text-xs font-medium border-b border-white/5">
                        <th className="text-left pb-3 font-medium">Automação</th>
                        <th className="text-center pb-3 font-medium">Tipo</th>
                        <th className="text-center pb-3 font-medium">Status</th>
                        <th className="text-right pb-3 font-medium">Enviados</th>
                        <th className="text-right pb-3 font-medium">Abertos</th>
                        <th className="text-right pb-3 font-medium">Conversões</th>
                        <th className="text-center pb-3 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {automacoes.map((a) => (
                        <tr key={a.id}
                          onClick={() => { setSelectedAutomacao(a); setEditAutomacao({ nome: a.nome, descricao: a.descricao }) }}
                          className="hover:bg-white/5 transition-colors cursor-pointer">
                          <td className="py-3 pr-4">
                            <p className="font-semibold text-white">{a.nome}</p>
                            <p className="text-xs text-white/30 mt-0.5">{a.descricao}</p>
                          </td>
                          <td className="py-3 text-center">
                            <span className="text-lg">{a.tipo === 'email' ? '📧' : '💬'}</span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              a.status === 'ativo' ? 'bg-[#D1FAE5] text-[#065F46]' :
                              a.status === 'pausado' ? 'bg-[#FEF3C7] text-[#92400E]' :
                              'bg-white/10 text-white/40'
                            }`}>{a.status.toUpperCase()}</span>
                          </td>
                          <td className="py-3 text-right font-semibold text-white/60">{a.enviados.toLocaleString()}</td>
                          <td className="py-3 text-right">
                            <span className="font-semibold text-[#3B82F6]">{a.enviados > 0 ? Math.round(a.abertos/a.enviados*100) : 0}%</span>
                          </td>
                          <td className="py-3 text-right">
                            <span className="font-bold text-[#10B981]">{a.conversoes}</span>
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={e => { e.stopPropagation(); setAutomacoes(p => p.map(x => x.id === a.id ? { ...x, status: x.status === 'ativo' ? 'pausado' : 'ativo' } : x)) }}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${a.status === 'ativo' ? 'bg-[#FEF3C7]/20 text-[#F5A623] hover:bg-[#FEF3C7]/30' : 'bg-[#D1FAE5]/20 text-[#1B8A5A] hover:bg-[#D1FAE5]/30'}`}>
                                {a.status === 'ativo' ? '⏸ Pausar' : '▶ Ativar'}
                              </button>
                              <button onClick={e => { e.stopPropagation(); setSelectedAutomacao(a); setEditAutomacao({ nome: a.nome, descricao: a.descricao }) }}
                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 transition-colors">
                                ✏️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Campanhas + Afiliados */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Campanhas */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-sora font-bold text-white">📣 Campanhas Pagas</h3>
                    <span className="text-xs text-white/40">Gasto total: R${campanhas.reduce((s,c)=>s+c.gasto,0).toLocaleString()}</span>
                  </div>
                  {campanhas.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-4xl mb-2">📣</p>
                      <p className="font-sora font-bold text-white text-sm">Nenhuma campanha rodando</p>
                      <p className="text-[10px] text-white/40 mt-1">Clique em <span className="font-semibold text-[#F5A623]">+ Nova Campanha</span> pra criar a primeira.</p>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    {campanhas.map((c) => {
                      const canais: Record<string, string> = { google: '🔵', meta: '🟦', insta: '🩷', yt: '🔴' }
                      return (
                        <div key={c.id} onClick={() => { setSelectedCampanha(c); setEditCampanha({ nome: c.nome, gasto: c.gasto }) }} className="bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-colors border border-transparent hover:border-[#F5A623]/20">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span>{canais[c.canal]}</span>
                                <p className="text-sm font-semibold text-white">{c.nome}</p>
                              </div>
                              <p className="text-xs text-white/30 mt-0.5">CAC: R${c.cac.toFixed(0)} · {c.conversoes} conversões</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'ativo' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-white/10 text-white/40'}`}>{c.status.toUpperCase()}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div><p className="text-white/30">Gasto</p><p className="font-bold text-white">R${c.gasto}</p></div>
                            <div><p className="text-white/30">Leads</p><p className="font-bold text-[#3B82F6]">{c.leads}</p></div>
                            <div><p className="text-white/30">CPL</p><p className="font-bold text-[#F5A623]">R${c.custo_lead}</p></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  )}
                </div>

                {/* Afiliados */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-sora font-bold text-white">🤝 Programa de Afiliados</h3>
                    <button onClick={() => setNovoAfiliadoOpen(true)} className="text-xs bg-[#F5A623] text-[#1A3A6B] font-bold px-3 py-1.5 rounded-lg hover:opacity-90">+ Novo afiliado</button>
                  </div>
                  {afiliados.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-4xl mb-2">🤝</p>
                      <p className="font-sora font-bold text-white text-sm">Nenhum afiliado cadastrado</p>
                      <p className="text-[10px] text-white/40 mt-1">Clique em <span className="font-semibold text-[#F5A623]">+ Novo afiliado</span> pra criar um link rastreável.</p>
                    </div>
                  ) : (
                  <>
                  <div className="space-y-3">
                    {afiliados.map((a) => (
                      <div key={a.id} onClick={() => setSelectedAfiliado(a)} className="bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-colors border border-transparent hover:border-[#F5A623]/20">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{a.nome}</p>
                            <p className="text-xs text-white/30 font-mono">{a.codigo} · {a.comissao}% comissão</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-[#10B981]">R${a.pago.toFixed(0)} pago</p>
                            <p className="text-xs text-[#F5A623]">R${a.pendente.toFixed(0)} pendente</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div><p className="text-white/30">Cliques</p><p className="font-bold text-white">{a.cliques}</p></div>
                          <div><p className="text-white/30">Cadastros</p><p className="font-bold text-[#3B82F6]">{a.cadastros}</p></div>
                          <div><p className="text-white/30">Ativos</p><p className="font-bold text-[#10B981]">{a.ativos}</p></div>
                          <div><p className="text-white/30">MRR gerado</p><p className="font-bold text-[#F5A623]">R${a.mrr}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-4 text-center text-xs">
                    <div><p className="text-white/30">Total pago afiliados</p><p className="font-bold text-[#10B981] text-base">R${afiliados.reduce((s,a)=>s+a.pago,0).toFixed(0)}</p></div>
                    <div><p className="text-white/30">MRR gerado afiliados</p><p className="font-bold text-[#F5A623] text-base">R${afiliados.reduce((s,a)=>s+a.mrr,0).toLocaleString()}</p></div>
                  </div>
                  </>
                  )}
                </div>
              </div>

            </>
          )}

          {/* ── DASHBOARD ── */}
          {page === 'dashboard' && (
            <>
              <div>
                <h1 className="font-sora font-bold text-2xl text-white">Visão geral do SaaS</h1>
                <p className="text-white/40 text-sm mt-0.5">Todos os dados em tempo real — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                {[
                  { label: 'MRR',              value: `R$ ${totalMRR.toLocaleString()}`, sub: '+12% vs mês ant.', icon: '💰', color: '#1B8A5A' },
                  { label: 'Tenants ativos',   value: active.length,                    sub: `${trials.length} em trial`, icon: '✂️', color: '#60A5FA' },
                  { label: 'Total de clientes',value: totalClients.toLocaleString(),     sub: 'em todas barbearias', icon: '👥', color: '#F5A623' },
                  { label: 'Atendimentos',     value: totalAppts.toLocaleString(),       sub: 'este mês', icon: '📅', color: '#A78BFA' },
                ].map((k) => (
                  <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{k.icon}</span>
                      <span className="text-xs text-white/40 font-medium">{k.sub}</span>
                    </div>
                    <p className="font-sora font-extrabold text-2xl" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-xs text-white/40 font-medium mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Tickets e Tenants recentes lado a lado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tickets abertos */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-sora font-bold text-white">🎧 Tickets recentes</h3>
                    <button onClick={() => setPage('tickets')} className="text-xs text-[#F5A623] hover:underline">Ver todos →</button>
                  </div>
                  {tickets.filter((t) => t.status !== 'resolvido').length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-4xl mb-2">🎧</p>
                      <p className="font-sora font-bold text-white text-sm">Sem tickets abertos</p>
                      <p className="text-[10px] text-white/40 mt-1">Tudo em dia — nenhum chamado pendente.</p>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    {tickets.filter(t => t.status !== 'resolvido').slice(0,4).map((t) => {
                      const tipo = TIPO_TICKET[t.tipo as keyof typeof TIPO_TICKET]
                      const st = STATUS_TICKET[t.status as keyof typeof STATUS_TICKET]
                      return (
                        <div key={t.id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-xl p-2 -mx-2 transition-colors" onClick={() => { setPage('tickets'); setSelectedTicket(t) }}>
                          <span className="text-xl">{tipo.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{t.titulo}</p>
                            <p className="text-xs text-white/40">{t.tenant} · {t.data}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>{st.label}</span>
                        </div>
                      )
                    })}
                  </div>
                  )}
                </div>

                {/* Últimos cadastros */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-sora font-bold text-white">✂️ Últimos cadastros</h3>
                    <button onClick={() => setPage('tenants')} className="text-xs text-[#F5A623] hover:underline">Ver todos →</button>
                  </div>
                  {tenants.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-4xl mb-2">✂️</p>
                      <p className="font-sora font-bold text-white text-sm">Nenhuma barbearia ainda</p>
                      <p className="text-[10px] text-white/40 mt-1">As barbearias aparecem aqui conforme criam conta no sistema.</p>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    {tenants.slice(0,5).map((t) => {
                      const st = STATUS_TENANT[t.status as keyof typeof STATUS_TENANT]
                      return (
                        <div key={t.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-white">{t.name.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-semibold text-white">{t.name}</p>
                              <p className="text-[10px] text-white/40">{t.city} · {t.since}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                        </div>
                      )
                    })}
                  </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── ANALYTICS ── */}
          {page === 'analytics' && (
            <>
              <div>
                <h1 className="font-sora font-bold text-2xl text-white">Analytics do SaaS</h1>
                <p className="text-white/40 text-sm mt-0.5">Métricas de acesso, cadastros e engajamento</p>
              </div>

              {/* KPIs analytics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Visitas hoje',          value: '1.020',  sub: '▲ 5% vs ontem',     icon: '👁️',  color: '#60A5FA' },
                  { label: 'Cadastros esta semana',  value: '7',      sub: '▲ 40% vs semana ant',icon: '🆕',  color: '#1B8A5A' },
                  { label: 'Taxa de conversão',      value: '3,2%',   sub: 'trial → pago',       icon: '🎯',  color: '#F5A623' },
                  { label: 'Churn rate',             value: '4,8%',   sub: '▼ 0,5% vs mês ant',  icon: '📉',  color: '#F87171' },
                ].map((k) => (
                  <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{k.icon}</span>
                      <span className="text-xs text-white/40">{k.sub}</span>
                    </div>
                    <p className="font-sora font-extrabold text-2xl" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-xs text-white/40 mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Gráfico de visitas (barras) */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-sora font-bold text-white">Visitas ao site (últimos 13 dias)</h3>
                  <span className="text-xs text-white/40 bg-white/5 px-3 py-1 rounded-full">stylogestor.com.br</span>
                </div>
                <div className="flex items-end gap-2 h-40">
                  {ANALYTICS.pageViews.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-white/30">{v}</span>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-[#1A3A6B] to-[#3B82F6] transition-all hover:opacity-80"
                        style={{ height: `${(v / maxPageView) * 100}%`, minHeight: '4px' }}
                        title={`${ANALYTICS.days[i]}: ${v} visitas`}
                      />
                      <span className="text-[8px] text-white/30 rotate-45 origin-left mt-1 hidden md:block">
                        {ANALYTICS.days[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gráfico de cadastros */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-sora font-bold text-white mb-4">Novos cadastros por dia</h3>
                  <div className="flex items-end gap-2 h-24">
                    {ANALYTICS.signups.map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-white/40">{v}</span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-[#1B8A5A] to-[#34D399]"
                          style={{ height: `${(v / Math.max(...ANALYTICS.signups)) * 100}%`, minHeight: '4px' }}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/30 mt-3">Total no período: {ANALYTICS.signups.reduce((s, v) => s + v, 0)} cadastros</p>
                </div>

                {/* Distribuição por plano */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-sora font-bold text-white mb-4">Distribuição por plano</h3>
                  <div className="space-y-3">
                    {[
                      { plan: 'PREMIUM', count: 1, pct: 17 },
                      { plan: 'PRO',     count: 3, pct: 50 },
                      { plan: 'STARTER', count: 2, pct: 33 },
                    ].map((p) => (
                      <div key={p.plan}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-white">{p.plan}</span>
                          <span className="text-white/40">{p.count} tenants · {p.pct}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: PLAN_COLORS[p.plan] }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/40 mb-2">Páginas mais acessadas</p>
                    {[
                      { page: '/login',     views: 324, pct: 85 },
                      { page: '/agenda',    views: 289, pct: 76 },
                      { page: '/clientes',  views: 201, pct: 53 },
                      { page: '/financeiro',views: 156, pct: 41 },
                    ].map((p) => (
                      <div key={p.page} className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-white/60 w-28 font-mono">{p.page}</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#F5A623] rounded-full" style={{ width: `${p.pct}%` }} />
                        </div>
                        <span className="text-[10px] text-white/40 w-8 text-right">{p.views}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TENANTS ── */}
          {page === 'tenants' && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1">
                  <h1 className="font-sora font-bold text-2xl text-white">Barbearias e Salões</h1>
                  <p className="text-white/40 text-sm mt-0.5">{tenants.length} tenants cadastrados · {active.length} ativos · {trials.length} em trial</p>
                </div>
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 w-48" />
                <button onClick={() => setNovoTenantOpen(true)}
                  className="bg-[#F5A623] text-[#1A3A6B] font-bold text-sm px-4 py-2 rounded-xl hover:opacity-90 whitespace-nowrap">
                  + Nova Barbearia
                </button>
                <button onClick={() => {
                  if (confirm('Redefinir para dados iniciais? Perderá todas as alterações.')) {
                    ['sg_tenants','sg_tickets','sg_campanhas','sg_automacoes','sg_afiliados','sg_suspended'].forEach(k => localStorage.removeItem(k))
                    window.location.reload()
                  }
                }} className="text-xs text-white/20 hover:text-white/40 transition-colors px-2 py-1.5 rounded-lg" title="Redefinir dados">↺</button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Barbearia','Plano','Status','MRR','Clientes','Agend.','Último login','Ações'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTenants.map((t) => {
                      const st = STATUS_TENANT[t.status as keyof typeof STATUS_TENANT]
                      return (
                        <tr key={t.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-white">{t.name}</p>
                            <p className="text-[10px] text-white/30">{t.slug}.stylogestor.com.br · {t.city}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: PLAN_COLORS[t.plan] + '22', color: PLAN_COLORS[t.plan] }}>{t.plan}</span>
                          </td>
                          <td className="px-4 py-3.5"><span className={`text-xs font-bold px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span></td>
                          <td className="px-4 py-3.5 font-bold" style={{ color: t.mrr > 0 ? '#1B8A5A' : '#6B7280' }}>{t.mrr > 0 ? `R$ ${t.mrr}` : '—'}</td>
                          <td className="px-4 py-3.5 text-white/60">{t.clients}</td>
                          <td className="px-4 py-3.5 text-white/60">{t.appts}</td>
                          <td className="px-4 py-3.5 text-white/40 text-xs">{t.lastLogin}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setSelectedTenant(t); setPage('tenant-detail') }}
                                className="text-[10px] bg-white/10 text-white px-2 py-1 rounded-lg hover:bg-white/20 transition-colors"
                              >Ver</button>
                              {t.status === 'past_due' && (
                                <button
                                  onClick={() => {
                                    setCobrancaEnviada(t.id)
                                    setTimeout(() => setCobrancaEnviada(null), 3000)
                                  }}
                                  className="text-[10px] bg-[#FEE2E2] text-[#991B1B] px-2 py-1 rounded-lg font-bold hover:bg-[#FECACA] transition-colors"
                                >
                                  {cobrancaEnviada === t.id ? '✓ Enviado' : 'Cobrar'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── DETALHE DO TENANT ── */}
          {page === 'tenant-detail' && selectedTenant && (() => {
            const t = selectedTenant
            const st = STATUS_TENANT[t.status as keyof typeof STATUS_TENANT]
            const tenantTickets = tickets.filter((tk) => tk.tenant === t.name)
            const isSuspended = tenantsSuspended.includes(t.id)
            // Dados financeiros simulados por tenant
            const finMensal = [
              { mes: 'Jan', receita: Math.round(t.mrr * 0.85), agend: Math.round(t.appts * 0.7) },
              { mes: 'Fev', receita: Math.round(t.mrr * 0.90), agend: Math.round(t.appts * 0.75) },
              { mes: 'Mar', receita: Math.round(t.mrr * 0.95), agend: Math.round(t.appts * 0.85) },
              { mes: 'Abr', receita: Math.round(t.mrr * 1.00), agend: Math.round(t.appts * 0.90) },
              { mes: 'Mai', receita: Math.round(t.mrr * 1.05), agend: t.appts },
            ]
            const maxRec = Math.max(...finMensal.map(d => d.receita))
            const ltv = t.mrr * 14
            const ticketMedio = t.appts > 0 ? Math.round((t.mrr * 1000 / t.appts) / 100) * 100 : 0
            const diasSemLogin = t.lastLogin === '11/05/2026' ? 0 : t.lastLogin === '10/05/2026' ? 1 : t.lastLogin === '08/05/2026' ? 3 : 45
            const churnRisk = t.status === 'past_due' ? 'alto' : t.status === 'canceled' ? 'churned' : diasSemLogin > 7 ? 'medio' : 'baixo'
            const churnColor = { alto: '#EF4444', medio: '#F59E0B', baixo: '#1B8A5A', churned: '#6B7280' }[churnRisk]

            return (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={() => { setPage('tenants'); setSelectedTenant(null); setTenantTab('overview') }} className="text-white/50 hover:text-white text-sm transition-colors">← Voltar</button>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[#1A3A6B] text-lg" style={{ background: PLAN_COLORS[t.plan] }}>{t.name.charAt(0)}</div>
                  <div>
                    <h1 className="font-sora font-bold text-2xl text-white">{t.name}</h1>
                    <p className="text-white/40 text-xs">{t.slug}.stylogestor.com.br · {t.city}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                  {isSuspended && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-900/30 text-red-400">⛔ Suspensa</span>}
                  <div className="ml-auto flex gap-2">
                    <a href={`mailto:${t.email}`} className="text-xs bg-white/10 text-white px-3 py-2 rounded-xl hover:bg-white/20">📧 Email</a>
                    <a href={`https://wa.me/${t.phone}?text=${encodeURIComponent('Olá! Sou da equipe STYLOGESTOR.')}`} target="_blank" className="text-xs bg-[#25D366] text-white px-3 py-2 rounded-xl hover:opacity-90">💬 WhatsApp</a>
                    <a href="https://app.stylogestor.com.br/dashboard" target="_blank" className="text-xs bg-white/10 text-white px-3 py-2 rounded-xl hover:bg-white/20">🔑 Painel</a>
                    {!isSuspended && t.status !== 'canceled' && (
                      <button onClick={() => { if (confirm(`Suspender ${t.name}?`)) setTenantsSuspended(p => [...p, t.id]) }} className="text-xs bg-red-500/20 text-red-400 px-3 py-2 rounded-xl hover:bg-red-500/30 font-bold">⛔ Suspender</button>
                    )}
                    {isSuspended && (
                      <button onClick={() => setTenantsSuspended(p => p.filter(i => i !== t.id))} className="text-xs bg-[#1B8A5A] text-white px-3 py-2 rounded-xl hover:bg-[#156b47] font-bold">🔄 Reativar suspensão</button>
                    )}
                    <button
                      onClick={() => { setTrialModalTenant(t); setTrialModalTab('days') }}
                      className="text-xs bg-[#3B82F6]/20 text-[#93C5FD] px-3 py-2 rounded-xl hover:bg-[#3B82F6]/30 font-bold"
                    >
                      ⏱️ Estender trial
                    </button>
                    {t.status !== 'canceled' ? (
                      <button
                        onClick={() => handleCancelarTenant(t.id, t.name)}
                        disabled={cancelandoLoading === t.id}
                        className="text-xs bg-orange-500/20 text-orange-300 px-3 py-2 rounded-xl hover:bg-orange-500/30 font-bold disabled:opacity-50"
                      >
                        {cancelandoLoading === t.id ? '...' : '🚫 Cancelar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReativarTenant(t.id, t.name)}
                        disabled={cancelandoLoading === t.id}
                        className="text-xs bg-[#1B8A5A] text-white px-3 py-2 rounded-xl hover:bg-[#156b47] font-bold disabled:opacity-50"
                      >
                        {cancelandoLoading === t.id ? '...' : '🔄 Reativar'}
                      </button>
                    )}
                    <button
                      onClick={() => { setExcluirTenant(t); setExcluirConfirmText('') }}
                      className="text-xs bg-red-600 text-white px-3 py-2 rounded-xl hover:bg-red-700 font-bold"
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>

                {/* KPIs principais */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {[
                    { label: 'Plano', value: t.plan, color: PLAN_COLORS[t.plan], icon: '💎' },
                    { label: 'MRR', value: t.mrr > 0 ? `R$${t.mrr}` : '—', color: '#1B8A5A', icon: '💰' },
                    { label: 'LTV estimado', value: `R$${ltv.toLocaleString()}`, color: '#60A5FA', icon: '📈' },
                    { label: 'Clientes', value: t.clients, color: '#A78BFA', icon: '👥' },
                    { label: 'Agendamentos', value: t.appts, color: '#F5A623', icon: '📅' },
                    { label: 'Risco churn', value: churnRisk.charAt(0).toUpperCase()+churnRisk.slice(1), color: churnColor, icon: '⚠️' },
                  ].map((k) => (
                    <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center gap-1.5 mb-2"><span className="text-lg">{k.icon}</span><p className="text-[10px] text-white/40 font-bold uppercase tracking-wide">{k.label}</p></div>
                      <p className="font-sora font-extrabold text-xl" style={{ color: k.color }}>{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* Abas */}
                <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                  {([['overview','📊 Visão Geral'],['financeiro','💰 Financeiro'],['atividade','📈 Atividade'],['suporte','🎧 Suporte']] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setTenantTab(id)}
                      className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${tenantTab === id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* ABA: VISÃO GERAL */}
                {tenantTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                      <p className="font-sora font-bold text-white">📋 Informações da conta</p>
                      {[
                        { label: 'E-mail', value: t.email },
                        { label: 'Telefone', value: `+${t.phone}` },
                        { label: 'Cidade', value: t.city },
                        { label: 'Cliente desde', value: t.since },
                        { label: 'Último login', value: t.lastLogin },
                        { label: 'Dias sem login', value: `${diasSemLogin} dias`, color: diasSemLogin > 7 ? '#EF4444' : '#1B8A5A' },
                      ].map((r) => (
                        <div key={r.label} className="flex justify-between text-sm border-b border-white/5 pb-2">
                          <span className="text-white/40">{r.label}</span>
                          <span className="font-medium" style={{ color: r.color ?? 'white' }}>{r.value}</span>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <a href={`https://${t.slug}.stylogestor.com.br`} target="_blank" className="flex-1 text-center text-xs bg-white/10 text-white py-2 rounded-xl hover:bg-white/20">🔗 Link agendamento</a>
                        {t.status === 'past_due' && (
                          <button
                            onClick={() => {
                              // TODO: integrar com Stripe/Pagar.me — endpoint
                              // POST /api/admin/tenants/:id/charge ainda não existe.
                              // Por enquanto registra a tentativa como nota interna
                              // pra ficar rastreável.
                              if (!confirm(`Disparar cobrança manual pra ${t.name}? (Stripe/Pagar.me ainda não integrado — vai registrar como nota interna)`)) return
                              const carimbo = `[${new Date().toLocaleString('pt-BR')}] Cobrança disparada manualmente pelo admin.`
                              setTenantNotes((prev) => ({
                                ...prev,
                                [t.id]: prev[t.id] ? `${prev[t.id]}\n${carimbo}` : carimbo,
                              }))
                              setCobrancaEnviada(t.id)
                              setTimeout(() => setCobrancaEnviada(null), 3000)
                            }}
                            className="flex-1 text-xs bg-[#FEE2E2] text-[#991B1B] font-bold py-2 rounded-xl hover:bg-[#FECACA]"
                          >
                            {cobrancaEnviada === t.id ? '✓ Registrado!' : '💳 Cobrar'}
                          </button>
                        )}
                        {t.status === 'canceled' && (
                          <button onClick={() => setTenantsSuspended(p => p.filter(i => i !== t.id))} className="flex-1 text-xs bg-[#1B8A5A] text-white font-bold py-2 rounded-xl">🔄 Reativar</button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Saúde da conta */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="font-sora font-bold text-white mb-3">🏥 Saúde da conta</p>
                        {[
                          { label: 'Engajamento', pct: Math.min(100, Math.round(t.appts / 5)), color: '#60A5FA' },
                          { label: 'Satisfação (suporte)', pct: tenantTickets.filter(x=>x.tipo==='elogio').length > 0 ? 95 : 72, color: '#1B8A5A' },
                          { label: 'Risco de churn', pct: churnRisk === 'alto' ? 85 : churnRisk === 'medio' ? 45 : 15, color: churnColor },
                        ].map(m => (
                          <div key={m.label} className="mb-2">
                            <div className="flex justify-between text-xs mb-1"><span className="text-white/50">{m.label}</span><span className="font-bold" style={{ color: m.color }}>{m.pct}%</span></div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} /></div>
                          </div>
                        ))}
                      </div>

                      {/* Plano e cobrança */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="font-sora font-bold text-white mb-3">💎 Plano e cobrança</p>
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div><p className="text-xs text-white/40">Plano atual</p><p className="font-bold text-lg" style={{ color: PLAN_COLORS[t.plan] }}>{t.plan}</p></div>
                          <div><p className="text-xs text-white/40">MRR</p><p className="font-bold text-lg text-[#1B8A5A]">R${t.mrr}</p></div>
                          <div><p className="text-xs text-white/40">LTV estimado</p><p className="font-bold text-[#60A5FA]">R${ltv.toLocaleString()}</p></div>
                          <div><p className="text-xs text-white/40">Ticket médio</p><p className="font-bold text-[#F5A623]">R${ticketMedio}</p></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA: FINANCEIRO */}
                {tenantTab === 'financeiro' && (
                  <div className="space-y-4">
                    {/* Gráfico de receita mensal */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <p className="font-sora font-bold text-white">📈 Receita gerada pela barbearia</p>
                          <p className="text-xs text-white/40 mt-0.5">Estimativa baseada em agendamentos · últimos 5 meses</p>
                        </div>
                        <div className="flex gap-2">
                          {/* CSV EXPORT */}
                          <button onClick={() => {
                            const BOM = '﻿'
                            const sep = ';'
                            const now = new Date().toLocaleDateString('pt-BR')
                            const totalRec = finMensal.reduce((s,d)=>s+d.receita,0)
                            const mediaRec = Math.round(totalRec/finMensal.length)
                            const crescimento = finMensal[0].receita > 0 ? `${Math.round(((finMensal[4].receita/finMensal[0].receita)-1)*100)}%` : 'N/A'
                            const rows = [
                              [`RELATORIO FINANCEIRO - STYLOGESTOR`],
                              [`Gerado em${sep}${now}`],
                              [],
                              [`DADOS DA BARBEARIA`],
                              [`Nome${sep}${t.name}`],
                              [`Slug${sep}${t.slug}.stylogestor.com.br`],
                              [`Cidade${sep}${t.city}`],
                              [`Plano${sep}${t.plan}`],
                              [`Status${sep}${st.label}`],
                              [`Cliente desde${sep}${t.since}`],
                              [`E-mail${sep}${t.email}`],
                              [],
                              [`METRICAS FINANCEIRAS`],
                              [`MRR atual${sep}R$ ${t.mrr}`],
                              [`ARR estimado${sep}R$ ${(t.mrr*12).toLocaleString('pt-BR')}`],
                              [`LTV estimado (14m)${sep}R$ ${ltv.toLocaleString('pt-BR')}`],
                              [`Ticket medio${sep}R$ ${ticketMedio}`],
                              [`Total pago (5 meses)${sep}R$ ${(t.mrr*5).toLocaleString('pt-BR')}`],
                              [],
                              [`RECEITA MENSAL`],
                              [`Mes${sep}Receita (R$)${sep}Agendamentos${sep}Status`],
                              ...finMensal.map((d,i) => [
                                `${d.mes}/2026${sep}${d.receita.toLocaleString('pt-BR')}${sep}${d.agend}${sep}${i===finMensal.length-1&&t.status==='past_due'?'Pendente':'Pago'}`
                              ]),
                              [],
                              [`RESUMO`],
                              [`Receita total (5m)${sep}R$ ${totalRec.toLocaleString('pt-BR')}`],
                              [`Media mensal${sep}R$ ${mediaRec.toLocaleString('pt-BR')}`],
                              [`Crescimento${sep}${crescimento}`],
                              [`Total clientes${sep}${t.clients}`],
                              [`Total agendamentos${sep}${t.appts}`],
                            ]
                            const csv = BOM + rows.map(r => r.join('')).join('\r\n')
                            const b = new Blob([csv],{type:'text/csv;charset=utf-8;'})
                            const u = URL.createObjectURL(b)
                            const a = document.createElement('a')
                            a.href = u; a.download = `relatorio-${t.slug}-${now.replace(/\//g,'-')}.csv`; a.click()
                          }} className="text-xs bg-[#F5A623]/20 text-[#F5A623] font-bold px-3 py-1.5 rounded-lg hover:bg-[#F5A623]/30">
                            📥 CSV
                          </button>
                          {/* PDF EXPORT */}
                          <button onClick={() => {
                            const now = new Date().toLocaleDateString('pt-BR')
                            const totalRec = finMensal.reduce((s,d)=>s+d.receita,0)
                            const mediaRec = Math.round(totalRec/finMensal.length)
                            const crescimento = finMensal[0].receita > 0 ? `${Math.round(((finMensal[4].receita/finMensal[0].receita)-1)*100)}%` : 'N/A'
                            const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório — ${t.name}</title>
                            <style>
                              *{margin:0;padding:0;box-sizing:border-box}
                              body{font-family:Arial,sans-serif;color:#1C1C2E;padding:32px;font-size:13px}
                              .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1A3A6B;padding-bottom:16px;margin-bottom:24px}
                              .logo{font-size:22px;font-weight:900;color:#1A3A6B;letter-spacing:-1px}
                              .logo span{color:#F5A623}
                              .doc-title{text-align:right;color:#6B7280;font-size:12px}
                              .doc-title h2{color:#1C1C2E;font-size:16px;margin-bottom:4px}
                              .section{margin-bottom:24px}
                              .section-title{font-size:14px;font-weight:700;color:#1A3A6B;border-left:4px solid #F5A623;padding-left:10px;margin-bottom:12px}
                              .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
                              .info-row{display:flex;justify-content:space-between;padding:6px 10px;background:#F9FAFB;border-radius:6px}
                              .info-label{color:#6B7280;font-size:12px}
                              .info-value{font-weight:700;color:#1C1C2E}
                              table{width:100%;border-collapse:collapse;margin-top:8px}
                              thead tr{background:#1A3A6B;color:white}
                              thead th{padding:10px 12px;text-align:left;font-size:12px;font-weight:600}
                              tbody tr:nth-child(even){background:#F9FAFB}
                              tbody td{padding:9px 12px;border-bottom:1px solid #E5E7EB;font-size:12px}
                              .badge{padding:3px 8px;border-radius:20px;font-size:11px;font-weight:700}
                              .pago{background:#D1FAE5;color:#065F46}
                              .pendente{background:#FEE2E2;color:#991B1B}
                              .kpi-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:8px}
                              .kpi-card{background:#F0F4FF;border-radius:10px;padding:12px;text-align:center;border:1px solid #BFDBFE}
                              .kpi-label{font-size:11px;color:#6B7280;margin-bottom:4px}
                              .kpi-value{font-size:18px;font-weight:900;color:#1A3A6B}
                              .footer{margin-top:40px;padding-top:16px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;color:#9CA3AF;font-size:11px}
                              .status-badge{padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;display:inline-block}
                              @media print{body{padding:20px}.no-print{display:none}}
                            </style></head><body>
                            <div class="header">
                              <div>
                                <div class="logo">STYLO<span>GESTOR</span></div>
                                <div style="font-size:11px;color:#6B7280;margin-top:4px">Sistema de Gestão para Barbearias e Salões</div>
                              </div>
                              <div class="doc-title">
                                <h2>Relatório Financeiro</h2>
                                <div>Gerado em: ${now}</div>
                                <div style="margin-top:4px;font-weight:700;color:#1A3A6B">${t.name}</div>
                              </div>
                            </div>

                            <div class="section">
                              <div class="section-title">Dados da Barbearia</div>
                              <div class="info-grid">
                                <div class="info-row"><span class="info-label">Nome</span><span class="info-value">${t.name}</span></div>
                                <div class="info-row"><span class="info-label">Plano</span><span class="info-value">${t.plan}</span></div>
                                <div class="info-row"><span class="info-label">Status</span><span class="info-value">${st.label}</span></div>
                                <div class="info-row"><span class="info-label">Cidade</span><span class="info-value">${t.city}</span></div>
                                <div class="info-row"><span class="info-label">Cliente desde</span><span class="info-value">${t.since}</span></div>
                                <div class="info-row"><span class="info-label">E-mail</span><span class="info-value">${t.email}</span></div>
                                <div class="info-row"><span class="info-label">Clientes cadastrados</span><span class="info-value">${t.clients}</span></div>
                                <div class="info-row"><span class="info-label">Total agendamentos</span><span class="info-value">${t.appts}</span></div>
                              </div>
                            </div>

                            <div class="section">
                              <div class="section-title">KPIs Financeiros</div>
                              <div class="kpi-row">
                                <div class="kpi-card"><div class="kpi-label">MRR Atual</div><div class="kpi-value">R$ ${t.mrr}</div></div>
                                <div class="kpi-card"><div class="kpi-label">ARR Estimado</div><div class="kpi-value">R$ ${(t.mrr*12).toLocaleString('pt-BR')}</div></div>
                                <div class="kpi-card"><div class="kpi-label">LTV Estimado (14m)</div><div class="kpi-value">R$ ${ltv.toLocaleString('pt-BR')}</div></div>
                                <div class="kpi-card"><div class="kpi-label">Receita Total (5m)</div><div class="kpi-value">R$ ${totalRec.toLocaleString('pt-BR')}</div></div>
                                <div class="kpi-card"><div class="kpi-label">Média Mensal</div><div class="kpi-value">R$ ${mediaRec.toLocaleString('pt-BR')}</div></div>
                                <div class="kpi-card"><div class="kpi-label">Crescimento</div><div class="kpi-value" style="color:#1B8A5A">${crescimento}</div></div>
                              </div>
                            </div>

                            <div class="section">
                              <div class="section-title">Receita Mensal (últimos 5 meses)</div>
                              <table>
                                <thead><tr><th>Mês</th><th>Receita (R$)</th><th>Agendamentos</th><th>Assinatura</th><th>Status</th></tr></thead>
                                <tbody>
                                  ${finMensal.map((d,i)=>`<tr>
                                    <td><strong>${d.mes}/2026</strong></td>
                                    <td><strong style="color:#1B8A5A">R$ ${d.receita.toLocaleString('pt-BR')}</strong></td>
                                    <td>${d.agend}</td>
                                    <td>${t.plan}</td>
                                    <td><span class="badge ${i===finMensal.length-1&&t.status==='past_due'?'pendente':'pago'}">${i===finMensal.length-1&&t.status==='past_due'?'Pendente':'Pago'}</span></td>
                                  </tr>`).join('')}
                                </tbody>
                              </table>
                            </div>

                            <div class="section">
                              <div class="section-title">Histórico de Pagamentos (Assinatura SaaS)</div>
                              <table>
                                <thead><tr><th>Competência</th><th>Plano</th><th>Valor (R$)</th><th>Status</th></tr></thead>
                                <tbody>
                                  ${finMensal.map((d,i)=>`<tr>
                                    <td>${d.mes}/2026</td>
                                    <td>${t.plan}</td>
                                    <td><strong>R$ ${t.mrr}</strong></td>
                                    <td><span class="badge ${i===finMensal.length-1&&t.status==='past_due'?'pendente':'pago'}">${i===finMensal.length-1&&t.status==='past_due'?'Pendente':'Pago'}</span></td>
                                  </tr>`).join('')}
                                  <tr style="background:#F0F4FF;font-weight:700">
                                    <td colspan="2"><strong>Total</strong></td>
                                    <td><strong style="color:#1B8A5A">R$ ${(t.mrr*5).toLocaleString('pt-BR')}</strong></td>
                                    <td></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <div class="footer">
                              <div>© ${new Date().getFullYear()} STYLOGESTOR — admin.stylogestor.com.br</div>
                              <div>Relatório gerado automaticamente em ${now} | Documento confidencial</div>
                            </div>
                            <script>window.onload=()=>window.print()</script>
                            </body></html>`
                            const w = window.open('','_blank','width=900,height=700')
                            if(w){ w.document.write(html); w.document.close() }
                          }} className="text-xs bg-[#60A5FA]/20 text-[#60A5FA] font-bold px-3 py-1.5 rounded-lg hover:bg-[#60A5FA]/30">
                            🖨️ PDF
                          </button>
                        </div>
                      </div>
                      <div className="flex items-end gap-3 h-40">
                        {finMensal.map((d) => (
                          <div key={d.mes} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] text-white/50">R${d.receita >= 1000 ? (d.receita/1000).toFixed(1)+'k' : d.receita}</span>
                            <div className="w-full rounded-t-lg transition-all"
                              style={{ height: `${(d.receita/maxRec)*120}px`, background: d.mes === 'Mai' ? '#1B8A5A' : 'rgba(27,138,90,0.3)' }} />
                            <span className="text-[10px] text-white/40">{d.mes}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-4 text-center text-xs">
                        <div><p className="text-white/40">Receita total (5m)</p><p className="font-bold text-[#1B8A5A] text-base">R${finMensal.reduce((s,d)=>s+d.receita,0).toLocaleString()}</p></div>
                        <div><p className="text-white/40">Média mensal</p><p className="font-bold text-white text-base">R${Math.round(finMensal.reduce((s,d)=>s+d.receita,0)/5).toLocaleString()}</p></div>
                        <div><p className="text-white/40">Crescimento</p><p className="font-bold text-[#60A5FA] text-base">+{Math.round(((finMensal[4].receita/finMensal[0].receita)-1)*100)}%</p></div>
                      </div>
                    </div>

                    {/* Pagamentos e plano */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <p className="font-sora font-bold text-white mb-4">💳 Histórico de pagamentos</p>
                        <div className="space-y-2">
                          {finMensal.map((d, i) => (
                            <div key={d.mes} className="flex items-center justify-between py-2 border-b border-white/5">
                              <div>
                                <p className="text-sm text-white font-medium">{d.mes}/2026</p>
                                <p className="text-xs text-white/30">Assinatura {t.plan}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-[#1B8A5A]">R${t.mrr}</p>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${i === finMensal.length-1 && t.status==='past_due' ? 'bg-[#FEE2E2] text-[#991B1B]' : 'bg-[#D1FAE5] text-[#065F46]'}`}>
                                  {i === finMensal.length-1 && t.status==='past_due' ? 'Pendente' : 'Pago'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                          <p className="font-sora font-bold text-white mb-3">📊 Métricas financeiras</p>
                          {[
                            { label: 'MRR atual', value: `R$${t.mrr}`, color: '#1B8A5A' },
                            { label: 'ARR estimado', value: `R$${(t.mrr*12).toLocaleString()}`, color: '#60A5FA' },
                            { label: 'LTV estimado (14m)', value: `R$${ltv.toLocaleString()}`, color: '#A78BFA' },
                            { label: 'Ticket médio', value: `R$${ticketMedio}`, color: '#F5A623' },
                            { label: 'Total pago (histórico)', value: `R$${(t.mrr * 5).toLocaleString()}`, color: '#1B8A5A' },
                          ].map(m => (
                            <div key={m.label} className="flex justify-between items-center py-1.5 border-b border-white/5">
                              <span className="text-xs text-white/40">{m.label}</span>
                              <span className="text-sm font-bold" style={{ color: m.color }}>{m.value}</span>
                            </div>
                          ))}
                        </div>
                        {t.status === 'past_due' && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                            <p className="font-bold text-red-400 mb-2">⚠️ Cobrança pendente</p>
                            <p className="text-xs text-white/50 mb-3">R${t.mrr} em aberto. Envie cobrança imediatamente.</p>
                            <button onClick={() => { setCobrancaEnviada(t.id); setTimeout(() => setCobrancaEnviada(null), 3000) }}
                              className="w-full bg-red-500 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-red-600">
                              {cobrancaEnviada === t.id ? '✓ Cobrança enviada!' : '💳 Enviar cobrança agora'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA: ATIVIDADE */}
                {tenantTab === 'atividade' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <p className="font-sora font-bold text-white mb-4">📅 Agendamentos por mês</p>
                      <div className="flex items-end gap-3 h-32">
                        {finMensal.map((d) => (
                          <div key={d.mes} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] text-white/50">{d.agend}</span>
                            <div className="w-full rounded-t-lg" style={{ height: `${(d.agend/t.appts)*100}px`, background: d.mes==='Mai' ? '#F5A623' : 'rgba(245,166,35,0.3)' }} />
                            <span className="text-[10px] text-white/40">{d.mes}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <p className="font-sora font-bold text-white mb-4">📱 Uso do sistema</p>
                      {[
                        { label: 'Último login', value: t.lastLogin, icon: '🕐' },
                        { label: 'Total agendamentos', value: t.appts, icon: '📅' },
                        { label: 'Total clientes', value: t.clients, icon: '👥' },
                        { label: 'Média agendam./mês', value: Math.round(t.appts/5), icon: '📊' },
                        { label: 'Cliente há (dias)', value: '75 dias', icon: '📆' },
                        { label: 'Módulos ativos', value: t.plan==='PREMIUM' ? '6/6' : t.plan==='PRO' ? '5/6' : '3/6', icon: '⚡' },
                      ].map(m => (
                        <div key={m.label} className="flex items-center justify-between py-1.5 border-b border-white/5">
                          <span className="text-xs text-white/40">{m.icon} {m.label}</span>
                          <span className="text-sm font-semibold text-white">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ABA: SUPORTE */}
                {tenantTab === 'suporte' && (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                        <p className="font-sora font-bold text-white">🎧 Chamados de suporte</p>
                        <span className="text-xs text-white/40">{tenantTickets.length} ticket(s)</span>
                      </div>
                      {tenantTickets.length === 0 ? (
                        <div className="p-10 text-center">
                          <p className="text-4xl mb-2">✅</p>
                          <p className="text-white/30 text-sm">Nenhum chamado aberto</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {tenantTickets.map((tk) => {
                            const stk = STATUS_TICKET[tk.status as keyof typeof STATUS_TICKET]
                            const tipo = TIPO_TICKET[tk.tipo as keyof typeof TIPO_TICKET]
                            return (
                              <div key={tk.id} className="px-5 py-4 flex items-center gap-3">
                                <span className="text-2xl">{tipo.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white font-semibold">{tk.titulo}</p>
                                  <p className="text-xs text-white/30 mt-0.5">{tk.data} · Prioridade {tk.prioridade}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stk.cls}`}>{stk.label}</span>
                                <button onClick={() => { setSelectedTicket(tk); setPage('tickets') }} className="text-[10px] bg-white/10 text-white px-3 py-1.5 rounded-lg hover:bg-white/20">
                                  Ver ticket
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    {/* Adicionar nota interna */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <p className="font-sora font-bold text-white mb-3">📝 Nota interna</p>
                      <textarea
                        rows={3}
                        placeholder="Adicione observações sobre esta barbearia (visível apenas para admins)..."
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 resize-none mb-3"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={() => {
                            const txt = noteDraft.trim()
                            setTenantNotes((prev) => {
                              const next = { ...prev }
                              if (txt) next[t.id] = txt
                              else delete next[t.id]
                              return next
                            })
                          }}
                          className="bg-[#F5A623] text-[#1A3A6B] font-bold text-sm px-4 py-2 rounded-xl hover:opacity-90"
                        >
                          💾 Salvar nota
                        </button>
                        {tenantNotes[t.id] && (
                          <span className="text-[10px] text-white/40">
                            ✓ Nota salva ({tenantNotes[t.id].length} caracteres)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )
          })()}

          {/* ── TICKETS / SUPORTE ── */}
          {page === 'tickets' && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="font-sora font-bold text-2xl text-white">Central de Suporte</h1>
                  <p className="text-white/40 text-sm mt-0.5">{ticketsAbertos} tickets aguardando resposta</p>
                </div>
                <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                  {(['todos','aberto','andamento','resolvido'] as const).map((f) => (
                    <button key={f} onClick={() => setTicketFiltro(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${ticketFiltro === f ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                      {f === 'todos' ? 'Todos' : f === 'andamento' ? 'Em andamento' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Lista de tickets */}
                <div className="lg:col-span-2 space-y-3">
                  {filteredTickets.map((t) => {
                    const tipo = TIPO_TICKET[t.tipo as keyof typeof TIPO_TICKET]
                    const st = STATUS_TICKET[t.status as keyof typeof STATUS_TICKET]
                    const prioColor = t.prioridade === 'alta' ? '#F87171' : t.prioridade === 'media' ? '#FCD34D' : '#6EE7B7'
                    return (
                      <div key={t.id} onClick={() => setSelectedTicket(selectedTicket?.id === t.id ? null : t)}
                        className={`bg-white/5 border rounded-2xl p-5 cursor-pointer transition-all hover:bg-white/8 ${selectedTicket?.id === t.id ? 'border-[#F5A623]/50 bg-white/8' : 'border-white/10'}`}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl shrink-0">{tipo.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-white">{t.titulo}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: prioColor + '22', color: prioColor }}>
                                {t.prioridade}
                              </span>
                            </div>
                            <p className="text-xs text-white/40 mt-1">{t.tenant} · {tipo.label} · {t.data}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {filteredTickets.length === 0 && (
                    <div className="text-center py-12 text-white/30">
                      <p className="text-4xl mb-2">🎉</p>
                      <p className="font-semibold">Nenhum ticket neste filtro</p>
                    </div>
                  )}
                </div>

                {/* Detalhe do ticket */}
                <div>
                  {selectedTicket ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 sticky top-6">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{TIPO_TICKET[selectedTicket.tipo as keyof typeof TIPO_TICKET].icon}</span>
                        <div>
                          <p className="font-sora font-bold text-white">{selectedTicket.titulo}</p>
                          <p className="text-xs text-white/40 mt-0.5">{selectedTicket.tenant}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: 'Tipo', value: TIPO_TICKET[selectedTicket.tipo as keyof typeof TIPO_TICKET].label },
                          { label: 'Status', value: STATUS_TICKET[selectedTicket.status as keyof typeof STATUS_TICKET].label },
                          { label: 'Prioridade', value: selectedTicket.prioridade },
                          { label: 'Data', value: selectedTicket.data },
                        ].map((i) => (
                          <div key={i.label} className="bg-white/5 rounded-xl p-2.5">
                            <p className="text-white/30 uppercase tracking-wide text-[9px]">{i.label}</p>
                            <p className="text-white font-semibold mt-0.5">{i.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Resposta já registrada */}
                      {selectedTicket?.resposta && (
                        <div className="bg-[#1B8A5A]/15 border border-[#1B8A5A]/30 rounded-xl p-3">
                          <p className="text-xs text-[#1B8A5A] font-semibold mb-1">✅ Resposta enviada:</p>
                          <p className="text-sm text-white/80">{selectedTicket.resposta}</p>
                        </div>
                      )}

                      {selectedTicket?.status !== 'resolvido' && (
                        <>
                          <div>
                            <label className="text-xs text-white/40 block mb-1.5">Responder ao cliente</label>
                            <textarea value={resposta} onChange={(e) => setResposta(e.target.value)}
                              placeholder="Digite sua resposta..."
                              rows={4}
                              className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#F5A623]/50 resize-none"
                            />
                          </div>
                          {ticketResolvido === 'erro' && (
                            <p className="text-xs text-red-400 text-center">⚠️ Digite uma resposta antes de resolver.</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (!resposta.trim()) {
                                  setTicketResolvido('erro')
                                  setTimeout(() => setTicketResolvido(null), 3000)
                                  return
                                }
                                setTickets(prev => prev.map(tk =>
                                  tk.id === selectedTicket!.id
                                    ? { ...tk, status: 'resolvido', resposta: resposta.trim() }
                                    : tk
                                ))
                                setTicketResolvido(selectedTicket!.id)
                                setTimeout(() => {
                                  setSelectedTicket(null)
                                  setResposta('')
                                  setTicketResolvido(null)
                                }, 2000)
                              }}
                              className="flex-1 bg-[#1B8A5A] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#156b47] transition-colors">
                              {ticketResolvido === selectedTicket?.id ? '✅ Resolvido!' : '✓ Responder e Resolver'}
                            </button>
                            <button
                              onClick={() => {
                                setTickets(prev => prev.map(tk =>
                                  tk.id === selectedTicket!.id ? { ...tk, status: 'andamento' } : tk
                                ))
                              }}
                              className="flex-1 border border-white/10 text-white/60 text-xs font-semibold py-2.5 rounded-xl hover:bg-white/5">
                              📋 Assumir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white/30">
                      <p className="text-4xl mb-2">👈</p>
                      <p className="font-semibold text-sm">Selecione um ticket para ver os detalhes e responder</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── RECEITA / FINANCEIRO STRIPE ── */}
          {page === 'revenue' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-sora font-bold text-2xl text-white">Financeiro · Stripe</h1>
                  <p className="text-white/40 text-sm mt-0.5">Receita, assinaturas e pagamentos em tempo real</p>
                </div>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  className="text-xs bg-[#F5A623] text-[#1A3A6B] font-bold px-4 py-2 rounded-xl hover:bg-[#e09610] transition-colors self-start sm:self-auto"
                >
                  Abrir Stripe Dashboard →
                </a>
              </div>

              {/* KPIs financeiros */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'MRR atual',     value: `R$ ${totalMRR.toLocaleString('pt-BR')}`, sub: 'receita recorrente mensal', color: '#1B8A5A' },
                  { label: 'ARR',           value: `R$ ${(totalMRR * 12).toLocaleString('pt-BR')}`, sub: 'receita anual projetada', color: '#60A5FA' },
                  { label: 'Churn rate',    value: '4,8%', sub: '1 cancelamento este mês', color: '#EF4444' },
                  { label: 'LTV médio',     value: 'R$ 2.682', sub: 'por tenant (18 meses)', color: '#F5A623' },
                  { label: 'CAC estimado',  value: 'R$ 45',    sub: 'custo de aquisição', color: '#A78BFA' },
                  { label: 'Payback',       value: '0,3 meses', sub: 'recuperação do CAC', color: '#34D399' },
                ].map((k) => (
                  <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wide">{k.label}</p>
                    <p className="font-sora font-extrabold text-2xl mt-1" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Receita por plano */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <p className="font-sora font-bold text-white">Receita por plano</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { plan: 'Premium', tenants: 1, mrr: 249,  color: '#7C3AED' },
                    { plan: 'Pro',     tenants: 2, mrr: 298,  color: '#1A3A6B' },
                    { plan: 'Starter', tenants: 2, mrr: 79,   color: '#6B7280' },
                  ].map((p) => {
                    const pct = Math.round((p.mrr / totalMRR) * 100)
                    return (
                      <div key={p.plan}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white font-semibold">{p.plan} <span className="text-white/40 font-normal text-xs">({p.tenants} tenants)</span></span>
                          <span className="font-bold" style={{ color: p.color }}>R$ {p.mrr}/mês · {pct}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: p.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Pagamentos recentes */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <p className="font-sora font-bold text-white">Pagamentos recentes</p>
                  <span className="text-xs text-white/40">Via Stripe</span>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    { tenant: 'Studio Beleza & Cia', plan: 'Premium', valor: 249, status: 'pago',     data: '10/05/2026', metodo: 'Cartão •••• 4242' },
                    { tenant: 'Barbearia do João',   plan: 'Pro',     valor: 149, status: 'pago',     data: '08/05/2026', metodo: 'Cartão •••• 1234' },
                    { tenant: 'Barber King',          plan: 'Starter', valor: 79,  status: 'pago',     data: '07/05/2026', metodo: 'Boleto' },
                    { tenant: 'Classic Barber Shop',  plan: 'Pro',     valor: 149, status: 'falhou',   data: '05/05/2026', metodo: 'Cartão •••• 0000' },
                    { tenant: 'Espaço Capilar',       plan: 'Starter', valor: 79,  status: 'cancelado',data: '01/04/2026', metodo: 'Cartão •••• 5678' },
                  ].map((p, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{p.tenant}</p>
                        <p className="text-xs text-white/40">{p.metodo} · {p.data}</p>
                      </div>
                      <span className="text-xs text-white/40 hidden sm:block">{p.plan}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        p.status === 'pago' ? 'bg-[#D1FAE5] text-[#065F46]' :
                        p.status === 'falhou' ? 'bg-[#FEE2E2] text-[#991B1B]' :
                        'bg-[#F3F4F6] text-[#6B7280]'
                      }`}>
                        {p.status === 'pago' ? '✓ Pago' : p.status === 'falhou' ? '✗ Falhou' : 'Cancelado'}
                      </span>
                      <span className={`font-bold text-sm w-16 text-right ${p.status === 'pago' ? 'text-[#1B8A5A]' : 'text-white/30 line-through'}`}>
                        R$ {p.valor}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assinaturas por status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Ativas',       count: 3, valor: 477,  color: '#1B8A5A', bg: 'bg-[#D1FAE5]/10 border-[#1B8A5A]/20' },
                  { label: 'Em trial',     count: 1, valor: 0,    color: '#60A5FA', bg: 'bg-[#DBEAFE]/10 border-[#60A5FA]/20' },
                  { label: 'Inadimplente', count: 1, valor: 149,  color: '#EF4444', bg: 'bg-[#FEE2E2]/10 border-[#EF4444]/20' },
                ].map((s) => (
                  <div key={s.label} className={`border rounded-2xl p-5 ${s.bg}`}>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-wide">{s.label}</p>
                    <p className="font-sora font-extrabold text-3xl mt-1" style={{ color: s.color }}>{s.count}</p>
                    {s.valor > 0 && <p className="text-xs text-white/30 mt-0.5">R$ {s.valor}/mês em risco</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── LOGS ── */}
          {page === 'logs' && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="font-sora font-bold text-2xl text-white">📜 Logs do sistema</h1>
                  <p className="text-xs text-white/40 mt-0.5">
                    Eventos importantes registrados pelos apps (criações, erros, crons).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchLogs()}
                    disabled={logsLoading}
                    className="text-xs bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white px-3 py-2 rounded-lg font-semibold"
                  >
                    {logsLoading ? '⏳ Carregando...' : '🔄 Atualizar'}
                  </button>
                  <button
                    onClick={handleCleanupLogs}
                    disabled={logCleanupBusy}
                    className="text-xs bg-red-500/20 hover:bg-red-500/30 disabled:opacity-40 text-red-300 px-3 py-2 rounded-lg font-semibold"
                  >
                    {logCleanupBusy ? '...' : '🗑️ Limpar > 30 dias'}
                  </button>
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-end gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-[10px] text-white/50 font-semibold uppercase tracking-wide block mb-1">
                    Nível
                  </label>
                  <select
                    value={logFilterLevel}
                    onChange={(e) => setLogFilterLevel(e.target.value as typeof logFilterLevel)}
                    className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                  >
                    <option value="" className="bg-[#1C2333]">Todos</option>
                    <option value="error" className="bg-[#1C2333]">Erro</option>
                    <option value="warn" className="bg-[#1C2333]">Aviso</option>
                    <option value="info" className="bg-[#1C2333]">Info</option>
                    <option value="debug" className="bg-[#1C2333]">Debug</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] text-white/50 font-semibold uppercase tracking-wide block mb-1">
                    Source (prefixo)
                  </label>
                  <input
                    type="text"
                    value={logFilterSource}
                    placeholder="ex.: api/tenants, cron/"
                    onChange={(e) => setLogFilterSource(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 font-mono"
                  />
                </div>
                {(logFilterLevel || logFilterSource) && (
                  <button
                    onClick={() => { setLogFilterLevel(''); setLogFilterSource('') }}
                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              {/* Lista */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {logsLoading && logs.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-sm">Carregando logs...</div>
                ) : logs.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-3xl mb-2">🔇</p>
                    <p className="text-sm text-white/40">Nenhum log encontrado</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {logs.map((log) => {
                      const levelColor =
                        log.level === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : log.level === 'warn' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : log.level === 'info' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-white/10 text-white/60 border-white/10'
                      const dt = new Date(log.createdAt)
                      const dtLabel = dt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                      const expanded = logExpanded === log.id
                      return (
                        <div key={log.id} className="px-4 py-3 hover:bg-white/5">
                          <div
                            className="flex items-start gap-3 cursor-pointer"
                            onClick={() => setLogExpanded(expanded ? null : log.id)}
                          >
                            <span className={`text-[10px] font-bold uppercase border rounded-md px-2 py-0.5 shrink-0 ${levelColor}`}>
                              {log.level}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs text-white/60">{log.source}</span>
                                <span className="text-[10px] text-white/40">·</span>
                                <span className="text-[10px] text-white/40">{dtLabel}</span>
                                {log.tenantId && (
                                  <span className="text-[10px] text-[#F5A623]/80 font-mono" title={log.tenantId}>
                                    tenant: {log.tenantId.slice(0, 8)}…
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-white mt-0.5 break-words">{log.message}</p>
                            </div>
                            {log.context !== null && log.context !== undefined && (
                              <span className="text-white/40 text-xs shrink-0">{expanded ? '▾' : '▸'}</span>
                            )}
                          </div>
                          {expanded && log.context !== null && log.context !== undefined && (
                            <pre className="mt-2 ml-12 text-[11px] bg-black/30 border border-white/5 rounded-lg p-3 overflow-x-auto text-white/70 font-mono whitespace-pre-wrap break-words">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {logNextCursor && (
                  <div className="border-t border-white/10 p-3 text-center">
                    <button
                      onClick={() => fetchLogs({ append: true })}
                      disabled={logsLoading}
                      className="text-xs bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white px-4 py-2 rounded-lg font-semibold"
                    >
                      {logsLoading ? 'Carregando...' : 'Carregar mais'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── SISTEMA / HEALTH ── */}
          {page === 'system' && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="font-sora font-bold text-2xl text-white">🩺 Status do sistema</h1>
                  <p className="text-xs text-white/40 mt-0.5">
                    Health check ao vivo de cada app — versão (commit), data do build, latência.
                  </p>
                </div>
                <button
                  onClick={refreshHealth}
                  disabled={healthLoading}
                  className="text-xs bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white px-3 py-2 rounded-lg font-semibold"
                >
                  {healthLoading ? '⏳ Verificando...' : '🔄 Verificar agora'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {appsHealth.map((app) => {
                  const dotColor =
                    app.ok === null ? 'bg-white/20' :
                    app.ok ? 'bg-emerald-400' : 'bg-red-500'
                  const dotPulse = app.ok === null ? '' : app.ok ? 'animate-pulse' : ''
                  const statusLabel =
                    app.ok === null ? 'Verificando…' :
                    app.ok ? 'Online' :
                    `Offline (${app.httpStatus ?? app.error ?? 'sem resposta'})`
                  return (
                    <div key={app.url} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor} ${dotPulse}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white">{app.name}</p>
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-white/40 hover:text-white/70 font-mono break-all"
                          >
                            {app.url}
                          </a>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${app.ok ? 'bg-emerald-500/20 text-emerald-300' : app.ok === false ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/50'}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                        <div className="bg-white/5 rounded-lg px-2 py-1.5">
                          <p className="text-white/40 uppercase text-[9px] font-semibold">Commit</p>
                          <p className="text-white font-mono truncate" title={app.version || ''}>
                            {app.version ? app.version.slice(0, 7) : '—'}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg px-2 py-1.5">
                          <p className="text-white/40 uppercase text-[9px] font-semibold">Build</p>
                          <p className="text-white">
                            {app.buildTime
                              ? new Date(app.buildTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })
                              : '—'}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg px-2 py-1.5">
                          <p className="text-white/40 uppercase text-[9px] font-semibold">Latência</p>
                          <p className="text-white">
                            {typeof app.latencyMs === 'number' ? `${app.latencyMs} ms` : '—'}
                          </p>
                        </div>
                      </div>
                      {app.ok === false && app.error && (
                        <p className="text-[10px] text-red-300/80 mt-2 font-mono break-words">{app.error}</p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white/50">
                <p className="font-semibold text-white/70 mb-1">ℹ️ Como funciona</p>
                <p>
                  Cada app expõe <code className="font-mono text-[#F5A623]">/api/health</code> retornando
                  versão (commit SHA), data de build e nome. Esse painel pinga todos em paralelo
                  diretamente do navegador — se algum estiver fora do ar, aparece offline aqui.
                </p>
              </div>
            </>
          )}

          {/* ── CONFIGURAÇÕES ── */}
          {page === 'settings' && (
            <>
              <h1 className="font-sora font-bold text-2xl text-white">Configurações do SaaS</h1>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-sora font-bold text-white">Planos e preços</h3>
                  {plans.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <p className="font-semibold text-white">{p.name}</p>
                        <p className="text-xs text-white/40">{planLimitLabel(p.profLimit)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#F5A623] font-bold">R$ {p.priceMonthly}/mês</span>
                        <button
                          onClick={() => {
                            setPlanDraft({ name: p.name, priceMonthly: p.priceMonthly, profLimit: p.profLimit })
                            setEditingPlanId(p.id)
                          }}
                          className="text-xs bg-white/10 text-white px-3 py-1 rounded-lg hover:bg-white/20"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Trial padrão ──────────────────────────────────── */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="font-sora font-bold text-white">⏱️ Trial padrão</h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      Quantos dias de teste cada nova barbearia recebe automaticamente ao se cadastrar.
                      Atual: <span className="font-semibold text-[#F5A623]">{defaultTrialDays} dias</span>.
                    </p>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-white/50 font-semibold uppercase tracking-wide block mb-1.5">
                        Dias
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={365}
                        value={trialDaysDraft}
                        onChange={(e) => setTrialDaysDraft(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                      />
                    </div>
                    <button
                      onClick={handleSaveTrialDays}
                      disabled={savingTrialDays || Number(trialDaysDraft) === defaultTrialDays}
                      className="bg-[#F5A623] disabled:opacity-40 text-[#1A3A6B] font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90"
                    >
                      {savingTrialDays ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>

                {/* ── Códigos promocionais ──────────────────────────── */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="font-sora font-bold text-white">🎟️ Códigos promocionais</h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      Códigos como &quot;INFLUENCER&quot; ou &quot;VIP60&quot; que você aplica em barbearias específicas
                      para dar tempo extra de trial.
                    </p>
                  </div>

                  {/* Form criar */}
                  <div className="bg-white/5 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-white/70">+ Novo código</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="CÓDIGO"
                        value={novoPromoForm.code}
                        onChange={(e) => setNovoPromoForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                        className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 font-mono"
                      />
                      <input
                        type="number"
                        placeholder="Dias trial"
                        min={1}
                        max={365}
                        value={novoPromoForm.trialDays}
                        onChange={(e) => setNovoPromoForm((f) => ({ ...f, trialDays: Number(e.target.value) }))}
                        className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                      />
                      <input
                        type="number"
                        placeholder="Limite usos (vazio = ∞)"
                        min={0}
                        value={novoPromoForm.usageLimit}
                        onChange={(e) => setNovoPromoForm((f) => ({ ...f, usageLimit: e.target.value }))}
                        className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                      />
                      <button
                        onClick={handleCreatePromo}
                        disabled={creatingPromo || !novoPromoForm.code.trim()}
                        className="bg-[#F5A623] disabled:opacity-40 text-[#1A3A6B] font-bold text-sm rounded-xl hover:opacity-90"
                      >
                        {creatingPromo ? '...' : '+ Criar'}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Descrição (opcional — pra que serve esse código)"
                      value={novoPromoForm.description}
                      onChange={(e) => setNovoPromoForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                    />
                  </div>

                  {/* Lista */}
                  {promoCodes.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-3xl mb-2">🎟️</p>
                      <p className="text-sm text-white/40">Nenhum código criado ainda</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {promoCodes.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-[#F5A623]">{p.code}</span>
                              <span className="text-[10px] font-bold bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
                                +{p.trialDays} dias
                              </span>
                              {!p.active && (
                                <span className="text-[10px] font-bold bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full">
                                  inativo
                                </span>
                              )}
                            </div>
                            {p.description && (
                              <p className="text-xs text-white/40 mt-0.5 truncate">{p.description}</p>
                            )}
                            <p className="text-[10px] text-white/30 mt-0.5">
                              Usados: {p.usedCount}{p.usageLimit ? ` / ${p.usageLimit}` : ' / ∞'}
                            </p>
                          </div>
                          {p.usedCount > 0 && (
                            <button
                              onClick={() => handleOpenRedemptions(p)}
                              className="text-xs bg-[#3B82F6]/20 hover:bg-[#3B82F6]/30 text-[#93C5FD] px-3 py-1.5 rounded-lg font-semibold"
                              title="Ver quais barbearias usaram esse código"
                            >
                              📋 Histórico
                            </button>
                          )}
                          <button
                            onClick={() => handleTogglePromo(p.id, !p.active)}
                            className="text-xs bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-lg"
                          >
                            {p.active ? 'Desativar' : 'Reativar'}
                          </button>
                          <button
                            onClick={() => handleDeletePromo(p.id, p.code)}
                            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg font-semibold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </main>
      </div>

      {/* ── MODAL CAMPANHA ── */}
      {selectedCampanha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCampanha(null)} />
          <div className="relative bg-[#1C2333] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="font-sora font-bold text-white">📣 Campanha</h3>
                <p className="text-xs text-white/40 mt-0.5">{selectedCampanha.canal.toUpperCase()} · {selectedCampanha.status.toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedCampanha(null)} className="text-white/40 hover:text-white text-2xl">×</button>
            </div>

            {/* Métricas completas */}
            <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/10">
              {[
                { label: 'Gasto total', value: `R$${selectedCampanha.gasto}`, color: 'text-white' },
                { label: 'Leads', value: selectedCampanha.leads, color: 'text-[#3B82F6]' },
                { label: 'Conversões', value: selectedCampanha.conversoes, color: 'text-[#10B981]' },
              ].map(s => (
                <div key={s.label} className="px-4 py-3 text-center">
                  <p className={`font-sora font-bold text-xl ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/10">
              {[
                { label: 'CPL', value: `R$${selectedCampanha.custo_lead}`, color: 'text-[#F5A623]' },
                { label: 'CAC', value: `R$${selectedCampanha.cac.toFixed(0)}`, color: 'text-[#F5A623]' },
                { label: 'Cliques', value: selectedCampanha.cliques.toLocaleString(), color: 'text-white/60' },
              ].map(s => (
                <div key={s.label} className="px-4 py-3 text-center">
                  <p className={`font-sora font-bold text-lg ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Nome da campanha</label>
                <input value={editCampanha.nome} onChange={e => setEditCampanha(f => ({ ...f, nome: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
              </div>
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Orçamento mensal (R$)</label>
                <input type="number" value={editCampanha.gasto} onChange={e => setEditCampanha(f => ({ ...f, gasto: Number(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setCampanhas(p => p.map(x => x.id === selectedCampanha.id ? { ...x, status: x.status === 'ativo' ? 'pausado' : 'ativo' } : x)); setSelectedCampanha(prev => prev ? { ...prev, status: prev.status === 'ativo' ? 'pausado' : 'ativo' } : null) }}
                  className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${selectedCampanha.status === 'ativo' ? 'border-[#F5A623]/30 bg-[#F5A623]/10 text-[#F5A623]' : 'border-[#1B8A5A]/30 bg-[#1B8A5A]/10 text-[#1B8A5A]'}`}>
                  {selectedCampanha.status === 'ativo' ? '⏸ Pausar' : '▶ Ativar'}
                </button>
                <button onClick={() => { if (confirm(`Excluir "${selectedCampanha.nome}"?`)) { setCampanhas(p => p.filter(x => x.id !== selectedCampanha.id)); setSelectedCampanha(null) } }}
                  className="py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-bold hover:bg-red-500/10">
                  🗑️ Excluir
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <button onClick={() => setSelectedCampanha(null)} className="flex-1 border border-white/10 text-white/60 text-sm font-semibold py-2.5 rounded-xl hover:bg-white/5">Cancelar</button>
              <button onClick={() => { setCampanhas(p => p.map(x => x.id === selectedCampanha.id ? { ...x, nome: editCampanha.nome, gasto: editCampanha.gasto } : x)); setSelectedCampanha(null) }}
                className="flex-1 bg-[#F5A623] text-[#1A3A6B] text-sm font-bold py-2.5 rounded-xl hover:opacity-90">
                ✓ Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL AFILIADO ── */}
      {selectedAfiliado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAfiliado(null)} />
          <div className="relative bg-[#1C2333] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="font-sora font-bold text-white">🤝 {selectedAfiliado.nome}</h3>
                <p className="text-xs text-white/40 mt-0.5">Código: <span className="font-mono text-[#F5A623]">{selectedAfiliado.codigo}</span> · {selectedAfiliado.comissao}% comissão</p>
              </div>
              <button onClick={() => setSelectedAfiliado(null)} className="text-white/40 hover:text-white text-2xl">×</button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 divide-x divide-white/5 border-b border-white/10">
              {[
                { label: 'Cliques', value: selectedAfiliado.cliques, color: 'text-white/70' },
                { label: 'Cadastros', value: selectedAfiliado.cadastros, color: 'text-[#3B82F6]' },
                { label: 'Ativos', value: selectedAfiliado.ativos, color: 'text-[#10B981]' },
                { label: 'MRR gerado', value: `R$${selectedAfiliado.mrr.toLocaleString()}`, color: 'text-[#F5A623]' },
              ].map(s => (
                <div key={s.label} className="px-3 py-3 text-center">
                  <p className={`font-sora font-bold text-lg ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Comissões */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1B8A5A]/10 border border-[#1B8A5A]/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-white/40 mb-1">Total já pago</p>
                  <p className="font-sora font-bold text-2xl text-[#1B8A5A]">R${selectedAfiliado.pago.toFixed(0)}</p>
                </div>
                <div className="bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-white/40 mb-1">Pendente pagamento</p>
                  <p className="font-sora font-bold text-2xl text-[#F5A623]">R${selectedAfiliado.pendente.toFixed(0)}</p>
                </div>
              </div>

              {/* Link de afiliado */}
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-white/40 mb-1">Link de indicação</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-white/70 flex-1 truncate">app.stylogestor.com.br/cadastro?ref={selectedAfiliado.codigo}</code>
                  <button onClick={() => navigator.clipboard.writeText(`https://app.stylogestor.com.br/cadastro?ref=${selectedAfiliado.codigo}`)}
                    className="text-xs bg-white/10 text-white px-2 py-1 rounded-lg hover:bg-white/20 shrink-0">
                    📋 Copiar
                  </button>
                </div>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => {
                  setAfiliados(p => p.map(x => x.id === selectedAfiliado.id ? { ...x, pago: x.pago + x.pendente, pendente: 0 } : x))
                  setSelectedAfiliado(prev => prev ? { ...prev, pago: prev.pago + prev.pendente, pendente: 0 } : null)
                }} className="py-2.5 rounded-xl bg-[#1B8A5A]/20 border border-[#1B8A5A]/30 text-[#1B8A5A] text-sm font-bold hover:bg-[#1B8A5A]/30 transition-colors">
                  💸 Marcar comissão paga
                </button>
                <button onClick={() => {
                  const link = `https://app.stylogestor.com.br/cadastro?ref=${selectedAfiliado.codigo}`
                  const msg = encodeURIComponent(`Oi ${selectedAfiliado.nome}! 🎉 Aqui está seu link de afiliado STYLOGESTOR: ${link}\nComissão: ${selectedAfiliado.comissao}%`)
                  window.open(`https://wa.me/?text=${msg}`, '_blank')
                }} className="py-2.5 rounded-xl bg-[#1B8A5A] text-white text-sm font-bold hover:bg-[#156b47] transition-colors">
                  💬 Enviar link WA
                </button>
                <button onClick={() => { if (confirm(`Remover ${selectedAfiliado.nome}?`)) { setAfiliados(p => p.filter(x => x.id !== selectedAfiliado.id)); setSelectedAfiliado(null) } }}
                  className="col-span-2 py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors">
                  🗑️ Remover afiliado
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10">
              <button onClick={() => setSelectedAfiliado(null)} className="w-full border border-white/10 text-white/60 text-sm font-semibold py-2.5 rounded-xl hover:bg-white/5">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NOVO AFILIADO ── */}
      {novoAfiliadoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNovoAfiliadoOpen(false)} />
          <div className="relative bg-[#1C2333] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="font-sora font-bold text-white">🤝 Novo Afiliado</h3>
              <button onClick={() => setNovoAfiliadoOpen(false)} className="text-white/40 hover:text-white text-2xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Nome *</label>
                <input value={formAfiliado.nome} onChange={e => setFormAfiliado(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: João Barber SP"
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
              </div>
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">E-mail</label>
                <input value={formAfiliado.email} onChange={e => setFormAfiliado(f => ({ ...f, email: e.target.value }))} placeholder="afiliado@email.com" type="email"
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
              </div>
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Código de indicação *</label>
                <input value={formAfiliado.codigo} onChange={e => setFormAfiliado(f => ({ ...f, codigo: e.target.value.toUpperCase() }))} placeholder="Ex: JOAO10"
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 font-mono focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
                <p className="text-xs text-white/30 mt-1">Link gerado: app.stylogestor.com.br/cadastro?ref={formAfiliado.codigo || 'CODIGO'}</p>
              </div>
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Comissão: {formAfiliado.comissao}%</label>
                <input type="range" min="5" max="30" step="5" value={formAfiliado.comissao} onChange={e => setFormAfiliado(f => ({ ...f, comissao: Number(e.target.value) }))}
                  className="w-full accent-[#F5A623]" />
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>5%</span><span>10%</span><span>15%</span><span>20%</span><span>25%</span><span>30%</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <button onClick={() => setNovoAfiliadoOpen(false)} className="flex-1 border border-white/10 text-white/60 text-sm font-semibold py-2.5 rounded-xl hover:bg-white/5">Cancelar</button>
              <button onClick={() => {
                if (!formAfiliado.nome || !formAfiliado.codigo) return
                const novo = { id: `AF${afiliados.length+1}`, nome: formAfiliado.nome, codigo: formAfiliado.codigo, comissao: formAfiliado.comissao, cliques: 0, cadastros: 0, ativos: 0, mrr: 0, pago: 0, pendente: 0 }
                setAfiliados(p => [...p, novo])
                setNovoAfiliadoOpen(false)
                setFormAfiliado({ nome: '', email: '', codigo: '', comissao: 15 })
              }} disabled={!formAfiliado.nome || !formAfiliado.codigo}
                className="flex-1 bg-[#F5A623] text-[#1A3A6B] text-sm font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40">
                ✓ Cadastrar afiliado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR AUTOMAÇÃO ── */}
      {selectedAutomacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAutomacao(null)} />
          <div className="relative bg-[#1C2333] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="font-sora font-bold text-white">⚙️ Editar Automação</h3>
                <p className="text-xs text-white/40 mt-0.5">{selectedAutomacao.nome}</p>
              </div>
              <button onClick={() => setSelectedAutomacao(null)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>

            {/* Stats rápidos */}
            <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/10">
              {[
                { label: 'Enviados', value: selectedAutomacao.enviados, color: 'text-white' },
                { label: 'Taxa abertura', value: `${selectedAutomacao.enviados > 0 ? Math.round(selectedAutomacao.abertos/selectedAutomacao.enviados*100) : 0}%`, color: 'text-[#3B82F6]' },
                { label: 'Conversões', value: selectedAutomacao.conversoes, color: 'text-[#10B981]' },
              ].map(s => (
                <div key={s.label} className="px-4 py-3 text-center">
                  <p className={`font-sora font-bold text-xl ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Nome</label>
                <input value={editAutomacao.nome} onChange={e => setEditAutomacao(f => ({ ...f, nome: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
              </div>
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Descrição</label>
                <input value={editAutomacao.descricao} onChange={e => setEditAutomacao(f => ({ ...f, descricao: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
              </div>

              {/* Ações rápidas */}
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-2">Ações rápidas</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setAutomacoes(p => p.map(x => x.id === selectedAutomacao.id ? { ...x, status: x.status === 'ativo' ? 'pausado' : 'ativo' } : x)); setSelectedAutomacao(prev => prev ? { ...prev, status: prev.status === 'ativo' ? 'pausado' : 'ativo' } : null) }}
                    className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${selectedAutomacao.status === 'ativo' ? 'border-[#F5A623]/30 bg-[#F5A623]/10 text-[#F5A623] hover:bg-[#F5A623]/20' : 'border-[#1B8A5A]/30 bg-[#1B8A5A]/10 text-[#1B8A5A] hover:bg-[#1B8A5A]/20'}`}>
                    {selectedAutomacao.status === 'ativo' ? '⏸ Pausar automação' : '▶ Ativar automação'}
                  </button>
                  <button onClick={() => { setAutomacoes(p => p.map(x => x.id === selectedAutomacao.id ? { ...x, enviados: 0, abertos: 0, cliques: 0, conversoes: 0 } : x)); setSelectedAutomacao(prev => prev ? { ...prev, enviados: 0, abertos: 0, cliques: 0, conversoes: 0 } : null) }}
                    className="py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-colors">
                    🔄 Resetar métricas
                  </button>
                  <button
                    onClick={() => { if (confirm(`Excluir "${selectedAutomacao.nome}"?`)) { setAutomacoes(p => p.filter(x => x.id !== selectedAutomacao.id)); setSelectedAutomacao(null) } }}
                    className="col-span-2 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors">
                    🗑️ Excluir automação
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <button onClick={() => setSelectedAutomacao(null)}
                className="flex-1 border border-white/10 text-white/60 text-sm font-semibold py-2.5 rounded-xl hover:bg-white/5">
                Cancelar
              </button>
              <button onClick={() => {
                setAutomacoes(p => p.map(x => x.id === selectedAutomacao.id ? { ...x, nome: editAutomacao.nome, descricao: editAutomacao.descricao } : x))
                setSelectedAutomacao(null)
              }} className="flex-1 bg-[#F5A623] text-[#1A3A6B] text-sm font-bold py-2.5 rounded-xl hover:opacity-90">
                ✓ Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALHE DO LEAD ── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
          <div className="relative bg-[#1C2333] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="font-sora font-bold text-white text-lg">👤 Detalhes do Lead</h3>
              <button onClick={() => setSelectedLead(null)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Avatar + nome */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1A3A6B] flex items-center justify-center text-white text-2xl font-bold">
                  {selectedLead.nome.charAt(0)}
                </div>
                <div>
                  <p className="font-sora font-bold text-white text-lg">{selectedLead.nome}</p>
                  <p className="text-white/50 text-sm">{selectedLead.email}</p>
                </div>
                {/* Score ring */}
                <div className="ml-auto w-14 h-14 relative shrink-0">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                    <circle cx="28" cy="28" r="22" fill="none"
                      stroke={selectedLead.score > 70 ? '#1B8A5A' : selectedLead.score > 40 ? '#F59E0B' : '#6B7280'}
                      strokeWidth="4"
                      strokeDasharray={`${selectedLead.score * 1.382} 138.2`}
                      strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{selectedLead.score}</span>
                </div>
              </div>

              {/* Dados */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Cidade', value: selectedLead.cidade },
                  { label: 'Origem', value: selectedLead.origem },
                  { label: 'Plano interesse', value: selectedLead.plano },
                  { label: 'Data cadastro', value: selectedLead.data },
                ].map(d => (
                  <div key={d.label} className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/40 mb-0.5">{d.label}</p>
                    <p className="text-sm font-semibold text-white">{d.value}</p>
                  </div>
                ))}
              </div>

              {/* Status badge */}
              <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                <span className="text-sm text-white/60">Status atual</span>
                <span className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ background: selectedLead.status === 'quente' ? '#EF4444' + '20' : selectedLead.status === 'trial' ? '#3B82F620' : '#6B728020', color: selectedLead.status === 'quente' ? '#EF4444' : selectedLead.status === 'trial' ? '#3B82F6' : '#9CA3AF' }}>
                  {selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Ações */}
            <div className="px-6 py-4 border-t border-white/10 grid grid-cols-2 gap-2">
              <a href={`mailto:${selectedLead.email}`}
                className="flex items-center justify-center gap-2 bg-[#1A3A6B] text-white text-sm font-bold py-2.5 rounded-xl hover:bg-[#142d55] transition-colors">
                📧 Enviar email
              </a>
              <a href={`https://wa.me/55?text=${encodeURIComponent(`Oi ${selectedLead.nome.split(' ')[0]}! Vi que você se cadastrou no STYLOGESTOR. Posso te ajudar a configurar tudo? 😊`)}`}
                target="_blank"
                className="flex items-center justify-center gap-2 bg-[#1B8A5A] text-white text-sm font-bold py-2.5 rounded-xl hover:bg-[#156b47] transition-colors">
                💬 WhatsApp
              </a>
              <button onClick={() => setSelectedLead(null)}
                className="col-span-2 border border-white/10 text-white/50 text-sm py-2 rounded-xl hover:bg-white/5 transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NOVA AUTOMAÇÃO ── */}
      {novaAutomacaoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNovaAutomacaoOpen(false)} />
          <div className="relative bg-[#1C2333] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#1C2333]">
              <h3 className="font-sora font-bold text-white text-lg">⚙️ Nova Automação</h3>
              <button onClick={() => setNovaAutomacaoOpen(false)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Nome da automação *</label>
                <input value={formAutomacao.nome} onChange={e => setFormAutomacao(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Follow-up após trial expirar"
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
              </div>

              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Tipo de mensagem</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: 'email', label: '📧 Email' }, { value: 'whatsapp', label: '💬 WhatsApp' }].map(t => (
                    <button key={t.value} onClick={() => setFormAutomacao(f => ({ ...f, tipo: t.value }))}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${formAutomacao.tipo === t.value ? 'border-[#F5A623] bg-[#F5A623]/10 text-[#F5A623]' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Gatilho (quando disparar)</label>
                <select value={formAutomacao.gatilho} onChange={e => setFormAutomacao(f => ({ ...f, gatilho: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50">
                  <option value="cadastro">🆕 Cadastro no trial</option>
                  <option value="trial_expira">⏰ Trial expirando (D-2)</option>
                  <option value="inativo">💤 Sem login por 5 dias</option>
                  <option value="pagamento">💳 Após pagamento</option>
                  <option value="cancelamento">❌ Cancelamento</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Delay após gatilho</label>
                <select value={formAutomacao.delay} onChange={e => setFormAutomacao(f => ({ ...f, delay: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50">
                  <option value="0">⚡ Imediatamente</option>
                  <option value="1">📅 1 dia depois</option>
                  <option value="3">📅 3 dias depois</option>
                  <option value="7">📅 7 dias depois</option>
                  <option value="14">📅 14 dias depois</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Mensagem / Assunto</label>
                <textarea value={formAutomacao.mensagem} onChange={e => setFormAutomacao(f => ({ ...f, mensagem: e.target.value }))}
                  placeholder={formAutomacao.tipo === 'email' ? 'Assunto do email ou conteúdo da mensagem...' : 'Texto da mensagem WhatsApp... Use {{nome}} para personalizar.'}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 resize-none" />
              </div>

              <div className="bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-xl p-3 text-xs text-white/50">
                <p className="font-semibold text-[#F5A623] mb-1">💡 Variáveis disponíveis:</p>
                <p><code className="text-white/70">{'{{nome}}'}</code> — Nome do gestor · <code className="text-white/70">{'{{barbearia}}'}</code> — Nome da barbearia · <code className="text-white/70">{'{{plano}}'}</code> — Plano atual</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex gap-3 sticky bottom-0 bg-[#1C2333]">
              <button onClick={() => setNovaAutomacaoOpen(false)}
                className="flex-1 border border-white/10 text-white/60 text-sm font-semibold py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!formAutomacao.nome.trim()) return
                  const nova = {
                    id: `A${automacoes.length + 1}`,
                    nome: formAutomacao.nome,
                    tipo: formAutomacao.tipo,
                    status: 'ativo',
                    enviados: 0, abertos: 0, cliques: 0, conversoes: 0,
                    descricao: `${formAutomacao.gatilho === 'cadastro' ? 'Após cadastro' : formAutomacao.gatilho} · D+${formAutomacao.delay}`,
                  }
                  setAutomacoes(prev => [...prev, nova])
                  setNovaAutomacaoOpen(false)
                  setFormAutomacao({ nome: '', tipo: 'email', gatilho: 'cadastro', delay: '0', mensagem: '' })
                }}
                disabled={!formAutomacao.nome.trim()}
                className="flex-1 bg-[#F5A623] text-[#1A3A6B] text-sm font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
                ✓ Criar automação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NOVA CAMPANHA ── */}
      {novaCampanhaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNovaCampanhaOpen(false)} />
          <div className="relative bg-[#1C2333] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="font-sora font-bold text-white text-lg">📣 Nova Campanha</h3>
              <button onClick={() => setNovaCampanhaOpen(false)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Nome da campanha *</label>
                <input
                  value={formCampanha.nome}
                  onChange={e => setFormCampanha(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Google Ads — Novos Barbeiros"
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Canal *</label>
                <select
                  value={formCampanha.canal}
                  onChange={e => setFormCampanha(f => ({ ...f, canal: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                >
                  {CANAIS_OPCOES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Objetivo</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'leads', label: '📧 Leads' },
                    { value: 'trial', label: '⚡ Trials' },
                    { value: 'brand', label: '👁️ Awareness' },
                  ].map(o => (
                    <button key={o.value} onClick={() => setFormCampanha(f => ({ ...f, objetivo: o.value }))}
                      className={`py-2 rounded-xl border text-xs font-semibold transition-all ${formCampanha.objetivo === o.value ? 'border-[#F5A623] bg-[#F5A623]/10 text-[#F5A623]' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Orçamento mensal (R$)</label>
                <input
                  type="number"
                  value={formCampanha.orcamento}
                  onChange={e => setFormCampanha(f => ({ ...f, orcamento: e.target.value }))}
                  placeholder="Ex: 500"
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                />
              </div>

              <div className="bg-white/5 rounded-xl p-3 text-xs text-white/40 space-y-1">
                <p>💡 <strong className="text-white/60">Dica:</strong> Após criar, acesse o painel do canal para configurar os anúncios.</p>
                <p>Os dados de cliques e leads serão atualizados automaticamente quando integrados via API.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <button onClick={() => setNovaCampanhaOpen(false)}
                className="flex-1 border border-white/10 text-white/60 text-sm font-semibold py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!formCampanha.nome.trim()) return
                  const nova = {
                    id: `C${campanhas.length + 1}`,
                    nome: formCampanha.nome,
                    canal: formCampanha.canal,
                    gasto: Number(formCampanha.orcamento) || 0,
                    cliques: 0, leads: 0,
                    custo_lead: 0, conversoes: 0, cac: 0,
                    status: 'ativo',
                  }
                  setCampanhas(prev => [...prev, nova])
                  setNovaCampanhaOpen(false)
                  setFormCampanha({ nome: '', canal: 'google', orcamento: '', objetivo: 'leads' })
                }}
                disabled={!formCampanha.nome.trim()}
                className="flex-1 bg-[#F5A623] text-[#1A3A6B] text-sm font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                ✓ Criar campanha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NOVA BARBEARIA ── */}
      {novoTenantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNovoTenantOpen(false)} />
          <div className="relative bg-[#1C2333] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="font-sora font-bold text-white text-lg">✂️ Cadastrar nova barbearia</h3>
                <p className="text-xs text-white/40 mt-0.5">Entra como Trial · pode alterar plano depois</p>
              </div>
              <button onClick={() => setNovoTenantOpen(false)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Nome da barbearia *</label>
                  <input value={formTenant.name} onChange={e => setFormTenant(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Barbearia do Silva"
                    className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">E-mail *</label>
                  <input type="email" value={formTenant.email} onChange={e => setFormTenant(f => ({ ...f, email: e.target.value }))}
                    placeholder="dono@barbearia.com"
                    className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">WhatsApp</label>
                  <input value={formTenant.phone} onChange={e => setFormTenant(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(11) 99999-0000"
                    className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Cidade</label>
                  <input value={formTenant.city} onChange={e => setFormTenant(f => ({ ...f, city: e.target.value }))}
                    placeholder="São Paulo"
                    className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Plano inicial</label>
                  <select value={formTenant.plan} onChange={e => setFormTenant(f => ({ ...f, plan: e.target.value }))}
                    className="w-full bg-[#0F172A] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50">
                    <option value="STARTER">Starter — R$79/mês</option>
                    <option value="PRO">Pro — R$149/mês</option>
                    <option value="PREMIUM">Premium — R$249/mês</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Slug personalizado (opcional)</label>
                  <div className="flex items-center gap-2">
                    <input value={formTenant.slug} onChange={e => setFormTenant(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'') }))}
                      placeholder={formTenant.name ? formTenant.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,20) : 'minha-barbearia'}
                      className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50" />
                    <span className="text-xs text-white/30 shrink-0">.stylogestor.com.br</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-xl p-3 flex items-start gap-2">
                <span className="text-lg">💡</span>
                <p className="text-xs text-white/50">O cliente entrará em <strong className="text-white/80">Trial gratuito de 14 dias</strong>. Você pode alterar o plano e status depois clicando em &quot;Ver&quot; na listagem.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <button onClick={() => setNovoTenantOpen(false)}
                className="flex-1 border border-white/10 text-white/60 text-sm font-semibold py-2.5 rounded-xl hover:bg-white/5">
                Cancelar
              </button>
              <button onClick={handleAdicionarTenant}
                disabled={!formTenant.name.trim() || !formTenant.email.trim()}
                className="flex-1 bg-[#F5A623] text-[#1A3A6B] text-sm font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
                ✓ Cadastrar barbearia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL HISTÓRICO DE RESGATES ── */}
      {redemptionsCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setRedemptionsCode(null)}
          />
          <div className="relative bg-[#1C2333] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <h3 className="font-sora font-bold text-white">Histórico do código</h3>
                  <span className="font-mono font-bold text-[#F5A623] text-sm">{redemptionsCode.code}</span>
                </div>
                <p className="text-xs text-white/40 mt-0.5">
                  +{redemptionsCode.trialDays} dias por uso · {redemptionsCode.usedCount} {redemptionsCode.usedCount === 1 ? 'resgate' : 'resgates'}
                  {redemptionsCode.usageLimit && ` · limite ${redemptionsCode.usageLimit}`}
                </p>
              </div>
              <button
                onClick={() => setRedemptionsCode(null)}
                className="text-white/40 hover:text-white text-2xl"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {redemptionsLoading ? (
                <div className="py-10 text-center text-white/40 text-sm">Carregando...</div>
              ) : redemptions.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-4xl mb-2">🤷</p>
                  <p className="text-sm text-white/40">Ninguém usou esse código ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {redemptions.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#1A3A6B] flex items-center justify-center font-bold text-white text-sm shrink-0">
                        {r.tenantName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{r.tenantName}</p>
                        <p className="text-xs text-white/40">
                          {r.tenantSlug ? `${r.tenantSlug}.stylogestor.com.br` : 'barbearia removida'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-[#10B981]">+{r.trialDays} dias</p>
                        <p className="text-[10px] text-white/40">
                          {new Date(r.appliedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setRedemptionsCode(null)}
                className="text-sm text-white/60 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ESTENDER TRIAL (3 abas: +dias / data exata / código) ── */}
      {trialModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !trialModalLoading && setTrialModalTenant(null)}
          />
          <div className="relative bg-[#1C2333] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-sora font-bold text-white">⏱️ Estender trial</h3>
                <p className="text-xs text-white/40 mt-0.5">{trialModalTenant.name}</p>
              </div>
              <button
                onClick={() => !trialModalLoading && setTrialModalTenant(null)}
                className="text-white/40 hover:text-white text-2xl"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 flex gap-1 border-b border-white/5">
              {([
                { id: 'days', label: '+ Dias' },
                { id: 'date', label: 'Data exata' },
                { id: 'code', label: 'Código' },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTrialModalTab(t.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${
                    trialModalTab === t.id
                      ? 'bg-white/10 text-[#F5A623]'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="px-6 py-5 space-y-4">
              {trialModalTab === 'days' && (
                <>
                  <label className="text-xs text-white/60 font-semibold uppercase tracking-wide block">
                    Adicionar dias ao trial atual
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={trialExtendDays}
                      onChange={(e) => setTrialExtendDays(e.target.value)}
                      className="flex-1 bg-[#0F172A] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                    />
                    <span className="text-sm text-white/60">dias</span>
                  </div>
                  <p className="text-[10px] text-white/40">
                    Soma à data atual de expiração (ou hoje, o que for maior).
                  </p>
                </>
              )}

              {trialModalTab === 'date' && (
                <>
                  <label className="text-xs text-white/60 font-semibold uppercase tracking-wide block">
                    Nova data fim do trial
                  </label>
                  <input
                    type="date"
                    value={trialNewDate}
                    onChange={(e) => setTrialNewDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-[#0F172A] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 [color-scheme:dark]"
                  />
                  <p className="text-[10px] text-white/40">
                    Substitui a data atual de expiração pela escolhida.
                  </p>
                </>
              )}

              {trialModalTab === 'code' && (
                <>
                  <label className="text-xs text-white/60 font-semibold uppercase tracking-wide block">
                    Código promocional
                  </label>
                  <input
                    type="text"
                    placeholder="EX: INFLUENCER, VIP60"
                    value={trialPromoCode}
                    onChange={(e) => setTrialPromoCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#0F172A] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 font-mono"
                  />
                  <p className="text-[10px] text-white/40">
                    Aplica os dias configurados no código. Códigos disponíveis em
                    <span className="font-semibold text-[#F5A623]"> Configurações → Códigos promocionais</span>.
                  </p>
                  {promoCodes.filter((p) => p.active).length > 0 && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-white/40 mb-2">Códigos ativos:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {promoCodes.filter((p) => p.active).map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setTrialPromoCode(p.code)}
                            className="text-[10px] font-mono font-bold bg-[#F5A623]/20 hover:bg-[#F5A623]/30 text-[#F5A623] px-2 py-1 rounded-lg"
                          >
                            {p.code} (+{p.trialDays}d)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setTrialModalTenant(null)}
                disabled={trialModalLoading}
                className="flex-1 border border-white/10 text-white/60 text-sm font-semibold py-2.5 rounded-xl hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyTrialChange}
                disabled={trialModalLoading}
                className="flex-1 bg-[#F5A623] text-[#1A3A6B] text-sm font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40"
              >
                {trialModalLoading ? 'Aplicando...' : '✓ Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EXCLUIR BARBEARIA (hard delete — destrutivo) ── */}
      {excluirTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !excluindoLoading && setExcluirTenant(null)}
          />
          <div className="relative bg-[#1C2333] border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🗑️</span>
                <h3 className="font-sora font-bold text-white">Excluir barbearia</h3>
              </div>
              <button
                onClick={() => !excluindoLoading && setExcluirTenant(null)}
                className="text-white/40 hover:text-white text-2xl"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-sm text-red-300 font-semibold mb-1">⚠️ Ação irreversível</p>
                <p className="text-xs text-white/70 leading-relaxed">
                  Isso vai apagar permanentemente <span className="font-bold text-white">{excluirTenant.name}</span>{' '}
                  e todos os dados associados:
                </p>
                <ul className="text-xs text-white/60 mt-2 ml-4 list-disc space-y-0.5">
                  <li>{excluirTenant.clients} {excluirTenant.clients === 1 ? 'cliente' : 'clientes'} cadastrados</li>
                  <li>{excluirTenant.appts} {excluirTenant.appts === 1 ? 'agendamento' : 'agendamentos'}</li>
                  <li>Profissionais, serviços, horários e assinatura</li>
                </ul>
                <p className="text-xs text-white/60 mt-2">
                  Se for só pra bloquear o acesso, prefira <span className="font-semibold text-orange-300">Cancelar</span>{' '}
                  — preserva os dados.
                </p>
              </div>

              <div>
                <label className="text-xs text-white/60 font-semibold block mb-1.5">
                  Pra confirmar, digite o nome exato:{' '}
                  <span className="font-mono text-white">{excluirTenant.name}</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={excluirConfirmText}
                  onChange={(e) => setExcluirConfirmText(e.target.value)}
                  placeholder={excluirTenant.name}
                  disabled={excluindoLoading}
                  className="w-full bg-[#0F172A] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setExcluirTenant(null)}
                disabled={excluindoLoading}
                className="flex-1 border border-white/10 text-white/60 text-sm font-semibold py-2.5 rounded-xl hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirTenant}
                disabled={excluindoLoading || excluirConfirmText !== excluirTenant.name}
                className="flex-1 bg-red-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-40 transition-opacity"
              >
                {excluindoLoading ? 'Excluindo...' : '🗑️ Excluir permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR PLANO ── */}
      {editingPlanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingPlanId(null)} />
          <div className="relative bg-[#1C2333] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="font-sora font-bold text-white">💰 Editar plano</h3>
                <p className="text-xs text-white/40 mt-0.5">Configuração visível na landing e na cobrança</p>
              </div>
              <button onClick={() => setEditingPlanId(null)} className="text-white/40 hover:text-white text-2xl" aria-label="Fechar">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Nome do plano</label>
                <input
                  value={planDraft.name}
                  onChange={(e) => setPlanDraft((d) => ({ ...d, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">Preço mensal (R$)</label>
                <input
                  type="number"
                  min={0}
                  value={planDraft.priceMonthly}
                  onChange={(e) => setPlanDraft((d) => ({ ...d, priceMonthly: Number(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wide block mb-1.5">
                  Limite de profissionais
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={-1}
                    disabled={planDraft.profLimit === -1}
                    value={planDraft.profLimit === -1 ? '' : planDraft.profLimit}
                    onChange={(e) => setPlanDraft((d) => ({ ...d, profLimit: Math.max(1, Number(e.target.value || 1)) }))}
                    placeholder="Quantidade"
                    className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 disabled:opacity-40"
                  />
                  <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planDraft.profLimit === -1}
                      onChange={(e) => setPlanDraft((d) => ({ ...d, profLimit: e.target.checked ? -1 : 5 }))}
                      className="accent-[#F5A623]"
                    />
                    Ilimitado
                  </label>
                </div>
                <p className="text-[10px] text-white/30 mt-1">
                  Preview: {planDraft.name || '—'} · R$ {planDraft.priceMonthly}/mês · {planLimitLabel(planDraft.profLimit)}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <button onClick={() => setEditingPlanId(null)}
                className="flex-1 border border-white/10 text-white/60 text-sm font-semibold py-2.5 rounded-xl hover:bg-white/5">
                Cancelar
              </button>
              <button
                onClick={() => {
                  setPlans((prev) => prev.map((p) =>
                    p.id === editingPlanId
                      ? { ...p, name: planDraft.name.trim() || p.name, priceMonthly: planDraft.priceMonthly, profLimit: planDraft.profLimit }
                      : p,
                  ))
                  setEditingPlanId(null)
                }}
                disabled={!planDraft.name.trim() || planDraft.priceMonthly < 0}
                className="flex-1 bg-[#F5A623] text-[#1A3A6B] text-sm font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                ✓ Salvar plano
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
