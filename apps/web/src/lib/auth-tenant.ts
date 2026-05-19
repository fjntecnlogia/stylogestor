import { auth } from '@clerk/nextjs/server'
import { prisma } from '@stylogestor/database'

/**
 * Resolve o tenantId do gestor logado via Clerk.
 *
 * Fluxo:
 *   1. auth() pega o userId do Clerk
 *   2. Lê publicMetadata.tenantSlug (setado pelo /api/tenants no onboarding)
 *   3. Busca o Tenant pelo slug → retorna id
 *
 * Fallback: se não tem slug no metadata (conta antiga), busca via
 * TenantUser pelo clerkId.
 *
 * Retorna `null` se:
 *   - Não está logado
 *   - User logado não tem tenant vinculado
 */
export async function getCurrentTenantId(): Promise<string | null> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null

  const tenantSlug = (sessionClaims?.metadata as { tenantSlug?: string } | undefined)?.tenantSlug

  if (tenantSlug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    })
    if (tenant) return tenant.id
  }

  // Fallback via TenantUser (user antigo sem tenantSlug no metadata)
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { user: { clerkId: userId } },
    select: { tenantId: true },
  })
  return tenantUser?.tenantId ?? null
}
