/**
 * STYLOGESTOR — Google Analytics 4 Events
 * Agente: Architect + Dev
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

const GA_ID = 'G-WK5QTXY1ZK'

// ── Evento genérico ──────────────────────────────────────────────
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', eventName, { ...params, send_to: GA_ID })
}

// ── Eventos de funil ─────────────────────────────────────────────

/** Clicou em "Começar grátis" */
export function trackCTAClick(location: string, plan?: string) {
  trackEvent('cta_click', { location, plan: plan ?? 'nenhum' })
}

/** Visitou a seção de planos */
export function trackPlansView() {
  trackEvent('plans_view')
}

/** Clicou em um plano específico */
export function trackPlanClick(plan: string, price: number) {
  trackEvent('plan_click', { plan, price })
}

/** Visitou página de ajuda */
export function trackHelpView(section: string) {
  trackEvent('help_view', { section })
}

/** Scroll profundo (75% da página) */
export function trackDeepScroll() {
  trackEvent('deep_scroll', { depth: 75 })
}

/** Clicou no WhatsApp / contato */
export function trackContactClick(channel: string) {
  trackEvent('contact_click', { channel })
}

/** Lead capturado (formulário) */
export function trackLeadCapture(source: string) {
  trackEvent('lead_capture', { source })
  // GA4 purchase-equivalent para funil
  trackEvent('generate_lead', { source })
}

/** Iniciou trial / cadastro */
export function trackTrialStart(plan: string) {
  trackEvent('trial_start', { plan })
  trackEvent('begin_checkout', { plan })
}

/** Vídeo assistido */
export function trackVideoPlay(title: string) {
  trackEvent('video_play', { title })
}

// ── Hook de scroll profundo ───────────────────────────────────────
let scrollTracked = false
export function initScrollTracking() {
  if (typeof window === 'undefined' || scrollTracked) return
  const handler = () => {
    const scrollPct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    if (scrollPct >= 75 && !scrollTracked) {
      scrollTracked = true
      trackDeepScroll()
      window.removeEventListener('scroll', handler)
    }
  }
  window.addEventListener('scroll', handler, { passive: true })
}
