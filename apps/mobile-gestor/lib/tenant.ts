// Bootstrap e onboarding da barbearia (tenant) no mobile-gestor.
//
// Fluxo (ver docs/AUTH_UNIFICATION.md, Fase 1):
//   1. Usuário faz login no Supabase (lib/auth.ts).
//   2. App chama `bootstrapTenant()`:
//        - GET /tenants/mine → se tiver barbearia, fixa o slug ativo e segue.
//        - se vier [] → precisa de onboarding (retorna { needsOnboarding: true }).
//   3. Onboarding: tela coleta nome/etc e chama `onboardTenant(input)` →
//      POST /tenants → fixa o slug ativo da barbearia recém-criada.
//   4. Logout: `clearActiveTenant()` limpa o slug.
//
// O slug ativo vive em lib/api.ts (cache em memória + SecureStore) e é injetado
// como header `x-tenant-slug` em todas as rotas tenant-scoped.

import {
  tenantsApi,
  setActiveTenantSlug,
  loadActiveTenantSlug,
  getActiveTenantSlug,
  type Membership,
  type CreateTenantInput,
} from './api'

export type BootstrapResult =
  | { needsOnboarding: false; tenant: Membership }
  | { needsOnboarding: true; tenant: null }

/**
 * Resolve a barbearia do usuário logado.
 *
 * Estratégia: primeiro tenta o slug já persistido (offline-friendly); em
 * paralelo confirma com a API. Se a API retornar lista vazia, sinaliza
 * onboarding. Se a API falhar mas houver slug persistido, segue com ele
 * (degrada graciosamente — ex: sem internet no boot).
 */
export async function bootstrapTenant(): Promise<BootstrapResult> {
  await loadActiveTenantSlug()

  let memberships: Membership[]
  try {
    memberships = await tenantsApi.mine()
  } catch (err) {
    // Sem rede / API fora: se já temos um slug salvo, segue com ele.
    const cached = getActiveTenantSlug()
    if (cached) {
      return {
        needsOnboarding: false,
        tenant: {
          id: '',
          slug: cached,
          name: '',
          logo: null,
          plan: 'FREE',
          role: 'owner',
        },
      }
    }
    throw err
  }

  if (memberships.length === 0) {
    await setActiveTenantSlug(null)
    return { needsOnboarding: true, tenant: null }
  }

  // Prioriza o slug persistido se ainda for válido; senão usa o primeiro.
  const cached = getActiveTenantSlug()
  const chosen =
    memberships.find((m) => m.slug === cached) ?? memberships[0]

  await setActiveTenantSlug(chosen.slug)
  return { needsOnboarding: false, tenant: chosen }
}

/**
 * Onboarding: cria a barbearia e já fixa como ativa.
 * Retorna o slug criado.
 */
export async function onboardTenant(input: CreateTenantInput): Promise<string> {
  const { tenant } = await tenantsApi.create(input)
  await setActiveTenantSlug(tenant.slug)
  return tenant.slug
}

/** Limpa a barbearia ativa (chamar no logout). */
export async function clearActiveTenant(): Promise<void> {
  await setActiveTenantSlug(null)
}

/** Lista todas as barbearias do usuário (pra um seletor multi-barbearia). */
export async function listMyTenants(): Promise<Membership[]> {
  return tenantsApi.mine()
}

/** Troca a barbearia ativa (multi-tenant). */
export async function switchTenant(slug: string): Promise<void> {
  await setActiveTenantSlug(slug)
}
