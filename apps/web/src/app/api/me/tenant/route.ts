import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'
import { readSettings, type TenantSettings } from '@/lib/tenant-settings'

/**
 * GET /api/me/tenant
 * Retorna dados da barbearia + settings (com defaults aplicados).
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
    const settings = readSettings(tenant.settings)

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
      ...settings,
    })
  } catch (err) {
    console.error('[ME_TENANT_GET_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}

/**
 * PATCH /api/me/tenant
 * Body: campos do tenant + qualquer subset de TenantSettings.
 *
 * Settings são merge no JSON existente (não sobrescreve campos não-enviados).
 */
export async function PATCH(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const {
      name, phone, email, address, city, state, logo,
      allowOverlapping, requireClientPhone, autoConfirmBooking,
      defaultAppointmentBuffer, bookingLeadHours,
      maxBookingDaysAhead, cancelDeadlineHours,
    } = body as Partial<{
      name: string; phone: string; email: string
      address: string; city: string; state: string; logo: string
    } & TenantSettings>

    const current = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { address: true, settings: true },
    })
    const currentAddr = (current?.address as Record<string, string> | null) ?? {}
    const currentSettings = readSettings(current?.settings)

    const addressData: Record<string, string> = { ...currentAddr }
    if (address !== undefined) addressData.street = address
    if (city !== undefined) addressData.city = city
    if (state !== undefined) addressData.state = state

    // Merge settings — só sobrescreve as chaves que vieram no body
    const newSettings: TenantSettings = {
      ...currentSettings,
      ...(allowOverlapping !== undefined ? { allowOverlapping: allowOverlapping === true } : {}),
      ...(requireClientPhone !== undefined ? { requireClientPhone: requireClientPhone !== false } : {}),
      ...(autoConfirmBooking !== undefined ? { autoConfirmBooking: autoConfirmBooking === true } : {}),
      ...(defaultAppointmentBuffer !== undefined
        ? { defaultAppointmentBuffer: Math.max(0, Math.min(120, Number(defaultAppointmentBuffer))) }
        : {}),
      ...(bookingLeadHours !== undefined
        ? { bookingLeadHours: Math.max(0, Math.min(168, Number(bookingLeadHours))) }
        : {}),
      ...(maxBookingDaysAhead !== undefined
        ? { maxBookingDaysAhead: Math.max(1, Math.min(365, Number(maxBookingDaysAhead))) }
        : {}),
      ...(cancelDeadlineHours !== undefined
        ? { cancelDeadlineHours: Math.max(0, Math.min(168, Number(cancelDeadlineHours))) }
        : {}),
    }

    const settingsChanged =
      allowOverlapping !== undefined || requireClientPhone !== undefined ||
      autoConfirmBooking !== undefined || defaultAppointmentBuffer !== undefined ||
      bookingLeadHours !== undefined || maxBookingDaysAhead !== undefined ||
      cancelDeadlineHours !== undefined

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
        ...(settingsChanged ? { settings: newSettings as never } : {}),
      },
      select: {
        name: true, phone: true, email: true, address: true, logo: true, settings: true,
      },
    })

    const addr = (updated.address as Record<string, string> | null) ?? {}
    const final = readSettings(updated.settings)
    return NextResponse.json({
      ok: true,
      name: updated.name,
      phone: updated.phone ?? '',
      email: updated.email ?? '',
      address: addr.street ?? '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      logo: updated.logo ?? '',
      ...final,
    })
  } catch (err) {
    console.error('[ME_TENANT_PATCH_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}
