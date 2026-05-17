// Compat helpers: Stripe moveu campos entre versões da API.
// API antiga: sub.current_period_start/end e invoice.subscription_details
// API nova (basil/dahlia): sub.items.data[0].current_period_start/end
// e invoice.parent.subscription_details.metadata.
import Stripe from 'stripe'

type SubWithLegacyPeriod = Stripe.Subscription & {
  current_period_start?: number
  current_period_end?: number
}

type InvoiceWithLegacySubDetails = Stripe.Invoice & {
  subscription_details?: {
    metadata?: Record<string, string> | null
    subscription?: string | Stripe.Subscription | null
  } | null
  subscription?: string | Stripe.Subscription | null
}

export function getPeriodStart(sub: Stripe.Subscription): number {
  const fromItem = sub.items?.data?.[0]?.current_period_start
  if (typeof fromItem === 'number') return fromItem
  return (sub as SubWithLegacyPeriod).current_period_start ?? 0
}

export function getPeriodEnd(sub: Stripe.Subscription): number {
  const fromItem = sub.items?.data?.[0]?.current_period_end
  if (typeof fromItem === 'number') return fromItem
  return (sub as SubWithLegacyPeriod).current_period_end ?? 0
}

/**
 * Extrai o `tenantId` do metadata da subscription embarcada na invoice.
 * Cobre tanto a API antiga (invoice.subscription_details.metadata)
 * quanto a nova (invoice.parent.subscription_details.metadata).
 */
export function getInvoiceTenantId(invoice: Stripe.Invoice): string | undefined {
  // Nova API
  const parent = (invoice as Stripe.Invoice & { parent?: unknown }).parent
  if (parent && typeof parent === 'object' && 'subscription_details' in parent) {
    const sd = (parent as { subscription_details?: { metadata?: Record<string, string> | null } })
      .subscription_details
    const t = sd?.metadata?.tenantId
    if (t) return t
  }
  // API antiga
  const legacy = (invoice as InvoiceWithLegacySubDetails).subscription_details?.metadata?.tenantId
  return legacy ?? undefined
}
