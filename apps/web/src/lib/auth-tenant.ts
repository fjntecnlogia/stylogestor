import { prisma } from '@stylogestor/database'
import { getServerUser } from './supabase/server'

/**
 * Resolve o tenantId do gestor logado via Supabase Auth.
 *
 * Fluxo (Fase 3 — login único):
 *   1. getServerUser() pega o usuário Supabase (via cookies).
 *   2. Lê app_metadata.tenantSlug (populado pelo backend / sincronizado).
 *   3. Busca o Tenant pelo slug → retorna id.
 *
 * Fallback: resolve via User (supabaseId ou email) → TenantUser.
 *
 * Retorna `null` se:
 *   - Não está logado
 *   - User logado não tem tenant vinculado
 */
export async function getCurrentTenantId(): Promise<string | null> {
  const user = await getServerUser()
  if (!user) return null

  const tenantSlug = (user.app_metadata as { tenantSlug?: string } | undefined)?.tenantSlug

  if (tenantSlug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    })
    if (tenant) return tenant.id
  }

  // Fallback: resolve pelo User (supabaseId ou email = chave de unificação).
  const orConditions: Array<Record<string, string>> = [{ supabaseId: user.id }]
  if (user.email) orConditions.push({ email: user.email })

  const tenantUser = await prisma.tenantUser.findFirst({
    where: { user: { OR: orConditions } },
    select: { tenantId: true },
  })
  return tenantUser?.tenantId ?? null
}
