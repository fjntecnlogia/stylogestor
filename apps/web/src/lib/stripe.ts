import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 7900,
    currency: 'brl',
    interval: 'month' as const,
    highlight: false,
    description: 'Para barbearias com 1 profissional',
    features: ['1 profissional', 'Agenda completa', 'Agendamento online', 'Clientes ilimitados'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 14900,
    currency: 'brl',
    interval: 'month' as const,
    highlight: true,
    description: 'Para barbearias em crescimento',
    features: ['Até 5 profissionais', 'WhatsApp automático', 'Financeiro completo', 'Comissões automáticas', 'Relatórios básicos', 'Suporte via chat'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 24900,
    currency: 'brl',
    interval: 'month' as const,
    highlight: false,
    description: 'Para redes e salões maiores',
    features: ['Profissionais ilimitados', 'Tudo do Pro', 'Controle de estoque', 'CRM avançado', 'Relatórios avançados', 'Suporte prioritário'],
  },
]
