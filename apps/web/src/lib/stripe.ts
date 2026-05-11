import Stripe from 'stripe'

// Instanciado somente em runtime (server-side), nunca durante o build
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY não configurada')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export { PLANS } from './plans'
