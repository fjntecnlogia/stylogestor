import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

/**
 * GET /api/me/tenant
 * Retorna dados da barbearia do gestor logado pra preencher o form
 * de Configurações > Dados da barbearia.
 */
export async function GET() {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true, slug: true, name: true, phone: true, email: true,
        address: true, logo: true, settings: true,
      },
    })
    if (!tenant) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

    const addr = (tenant.address as Record<string, string> | null) ?? {}
    const settings = (tenant.settings as Record<string, unknown> | null) ?? {}
    return NextResponse.json({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      phone: tenant.phone ?? '',
      email: tenant.email ?? '',
      address: addr.street ?? '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      logo: tenant.logo ?? '',
      allowOverlapping: settings.allowOverlapping === true,
    })
  } catch (err) {
    console.error('[ME_TENANT_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}

/**
 * PATCH /api/me/tenant
 * Body: { name?, phone?, email?, address?, city?, state?, logo? }
 *
 * Atualiza dados da própria barbearia. Address é um JSON no schema —
 * empacotamos { street, city, state } pra simplicidade do front.
 */
export async function PATCH(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const { name, phone, email, address, city, state, logo, allowOverlapping } = body as {
      name?: string; phone?: string; email?: string
      address?: string; city?: string; state?: string; logo?: string
      allowOverlapping?: boolean
    }

    // Address + settings: campos JSON merged. Lê o atual pra não
    // sobrescrever propriedades não-enviadas.
    const current = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { address: true, settings: true },
    })
    const currentAddr = (current?.address as Record<string, string> | null) ?? {}
    const currentSettings = (current?.settings as Record<string, unknown> | null) ?? {}

    const addressData: Record<string, string> = { ...currentAddr }
    if (address !== undefined) addressData.street = address
    if (city !== undefined) addressData.city = city
    if (state !== undefined) addressData.state = state

    const settingsData: Record<string, unknown> = { ...currentSettings }
    if (allowOverlapping !== undefined) settingsData.allowOverlapping = allowOverlapping === true
    // Prisma Json input precisa de cast — Record<string, unknown> não bate
    // com NullableJsonNullValueInput | InputJsonValue diretamente.
    const settingsJson = settingsData as never

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
        ...(email !== undefined ? { email: email.trim() || null } : {}),
        ...(logo !== undefined ? { logo: logo || null } : {}),
        ...(address !== undefined || city !== undefined || state !== undefined
          ? { address: addressData }
          : {}),
        ...(allowOverlapping !== undefined ? { settings: settingsJson } : {}),
      },
      select: {
        name: true, phone: true, email: true, address: true, logo: true, settings: true,
      },
    })

    const addr = (updated.address as Record<string, string> | null) ?? {}
    const upSettings = (updated.settings as Record<string, unknown> | null) ?? {}
    return NextResponse.json({
      ok: true,
      name: updated.name,
      phone: updated.phone ?? '',
      email: updated.email ?? '',
      address: addr.street ?? '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      logo: updated.logo ?? '',
      allowOverlapping: upSettings.allowOverlapping === true,
    })
  } catch (err) {
    console.error('[ME_TENANT_PATCH_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}
