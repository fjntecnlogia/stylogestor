import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@stylogestor/database'

/**
 * GET /api/me/debug
 *
 * Endpoint TEMPORÁRIO de diagnóstico — mostra exatamente o que
 * `getCurrentTenantId()` está vendo do user logado. Útil quando
 * aparece "Tenant não encontrado" sem motivo aparente.
 *
 * Retorna:
 *   - userId Clerk
 *   - email
 *   - sessionClaims.metadata (role + tenantSlug atuais no token)
 *   - publicMetadata fresh (vindo da API do Clerk)
 *   - tenant achado por slug (se houver)
 *   - tenantUsers no DB (TODOS — pra ver se a conta tá linkada
 *     a algum tenant via fallback)
 *
 * Acessível por qualquer gestor logado. Pode ser removido depois
 * que o problema tiver sido diagnosticado.
 */
export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const metadata = (sessionClaims?.metadata as Record<string, string> | undefined) ?? {}
  const tenantSlugFromToken = metadata.tenantSlug
  const roleFromToken = metadata.role

  // Email + publicMetadata fresh (não do token cacheado)
  const user = await currentUser()
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null
  const freshMetadata = (user?.publicMetadata as Record<string, unknown> | undefined) ?? {}

  // Tenant por slug do token
  let tenantBySlug = null
  if (tenantSlugFromToken) {
    tenantBySlug = await prisma.tenant.findUnique({
      where: { slug: tenantSlugFromToken },
      select: { id: true, slug: true, name: true, active: true },
    })
  }

  // Fallback: TenantUsers linkados a esse clerkId
  const tenantUsers = await prisma.tenantUser.findMany({
    where: { user: { clerkId: userId } },
    select: {
      tenantId: true,
      role: true,
      active: true,
      tenant: { select: { slug: true, name: true } },
      user: { select: { email: true } },
    },
  })

  return NextResponse.json({
    clerkUserId: userId,
    email,
    session: {
      tenantSlug: tenantSlugFromToken ?? null,
      role: roleFromToken ?? null,
    },
    publicMetadataFresh: freshMetadata,
    tenantBySlug,
    tenantUsersInDB: tenantUsers,
    diagnosis:
      tenantBySlug
        ? '✅ Resolve via session.metadata.tenantSlug — tudo OK'
        : tenantUsers.length > 0
        ? '⚠️ Session sem tenantSlug, mas TenantUser existe — getCurrentTenantId vai resolver pelo fallback. Se ainda assim quebrar, problema diferente.'
        : '❌ Nenhum tenant linkado. Conta precisa de onboarding OU TenantUser ficou órfão.',
  })
}
