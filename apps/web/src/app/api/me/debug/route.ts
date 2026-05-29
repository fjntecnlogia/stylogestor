import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'
import { prisma } from '@stylogestor/database'

/**
 * GET /api/me/debug
 *
 * Endpoint TEMPORÁRIO de diagnóstico — mostra o que `getCurrentTenantId()`
 * está vendo do user Supabase logado. Útil quando aparece "Tenant não
 * encontrado" sem motivo aparente.
 */
export async function GET() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const meta = (user.app_metadata ?? {}) as Record<string, unknown>
  const tenantSlugFromToken = meta.tenantSlug as string | undefined
  const roleFromToken = meta.role as string | undefined

  // Tenant por slug do app_metadata
  let tenantBySlug = null
  if (tenantSlugFromToken) {
    tenantBySlug = await prisma.tenant.findUnique({
      where: { slug: tenantSlugFromToken },
      select: { id: true, slug: true, name: true, active: true },
    })
  }

  // Fallback: TenantUsers linkados por supabaseId OU email
  const tenantUsers = await prisma.tenantUser.findMany({
    where: {
      user: { OR: [{ supabaseId: user.id }, ...(user.email ? [{ email: user.email }] : [])] },
    },
    select: {
      tenantId: true,
      role: true,
      active: true,
      tenant: { select: { slug: true, name: true } },
      user: { select: { email: true } },
    },
  })

  return NextResponse.json({
    supabaseUserId: user.id,
    email: user.email ?? null,
    appMetadata: meta,
    session: {
      tenantSlug: tenantSlugFromToken ?? null,
      role: roleFromToken ?? null,
    },
    tenantBySlug,
    tenantUsersInDB: tenantUsers,
    diagnosis: tenantBySlug
      ? '✅ Resolve via app_metadata.tenantSlug — tudo OK'
      : tenantUsers.length > 0
        ? '⚠️ app_metadata sem tenantSlug, mas TenantUser existe — getCurrentTenantId resolve pelo fallback.'
        : '❌ Nenhum tenant linkado. Conta precisa de onboarding OU TenantUser órfão.',
  })
}
