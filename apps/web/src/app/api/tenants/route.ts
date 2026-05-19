import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma, getSetting, SETTING_KEYS } from '@stylogestor/database'

// POST /api/tenants — criar tenant no onboarding
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const { name, type, phone, city, plan, schedules, professionals, services } = body

    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    // Gerar slug único
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30)

    // Verificar se slug já existe e adicionar sufixo se necessário
    let slug = baseSlug
    let attempt = 0
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      attempt++
      slug = `${baseSlug}-${attempt}`
    }

    // Dias de trial — lê do SystemSetting (gerenciado pelo admin) com
    // fallback de 14 dias se não houver setting salvo.
    const trialDays = await getSetting<number>(SETTING_KEYS.DEFAULT_TRIAL_DAYS, 14)

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name,
        type: type ?? 'barbershop',
        phone,
        email: undefined,
        plan: (plan as 'FREE' | 'STARTER' | 'PRO' | 'PREMIUM') ?? 'FREE',
        trialEndsAt: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
        active: true,
        address: city ? { city } : undefined,
      },
    })

    // Vincular usuário ao tenant
    await prisma.user.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, email: `${userId}@clerk.temp`, name: name },
      update: {},
    })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (user) {
      await prisma.tenantUser.upsert({
        where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
        create: { tenantId: tenant.id, userId: user.id, role: 'owner' },
        update: {},
      })
    }

    // Criar horários padrão
    if (schedules?.length) {
      await prisma.businessSchedule.createMany({
        data: schedules.map((s: { day: number; start: string; end: string; active: boolean }) => ({
          tenantId: tenant.id,
          dayOfWeek: s.day,
          startTime: s.start,
          endTime: s.end,
          active: s.active,
        })),
      })
    }

    // Criar profissional
    if (professionals?.length) {
      for (const prof of professionals) {
        await prisma.professional.create({
          data: {
            tenantId: tenant.id,
            name: prof.name,
            role: prof.role ?? 'Barbeiro',
            commission: Number(prof.commission ?? 40),
            commissionType: 'percentage',
            active: true,
          },
        })
      }
    }

    // Criar serviços
    if (services?.length) {
      await prisma.service.createMany({
        data: services.map((sv: { name: string; price: number; duration: number }) => ({
          tenantId: tenant.id,
          name: sv.name,
          price: sv.price,
          duration: sv.duration,
          active: true,
        })),
      })
    }

    // Criar subscription trial
    await prisma.subscription.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        plan: 'FREE',
        status: 'trial',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      update: {},
    })

    // Persiste no publicMetadata do Clerk user:
    //   - tenantSlug + tenantName: usados pelo frontend pra mostrar nome da
    //     barbearia no header e pra scoped localStorage
    //   - role 'gestor': lido pelo middleware (barbeiros recebem via invite)
    try {
      const client = await clerkClient()
      const existing = await client.users.getUser(userId)
      const existingMetadata = (existing.publicMetadata as Record<string, unknown>) ?? {}
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...existingMetadata,
          tenantSlug: slug,
          tenantName: name,
          role: existingMetadata.role ?? 'gestor',
        },
      })
    } catch (metaErr) {
      console.error('[TENANT_SET_METADATA_ERROR]', metaErr)
      // Não bloqueia: tenant foi criado, só o metadata falhou.
      // Usuário pode setar manualmente no Clerk depois se necessário.
    }

    // Retorna os profissionais e serviços já criados — usados pelo frontend
    // pra popular o localStorage scoped por tenant (até o módulo packages/api
    // de profissionais/serviços estar plugado).
    const createdProfessionals = professionals?.length
      ? await prisma.professional.findMany({ where: { tenantId: tenant.id } })
      : []
    const createdServices = services?.length
      ? await prisma.service.findMany({ where: { tenantId: tenant.id } })
      : []

    return NextResponse.json({
      ok: true,
      tenant: { id: tenant.id, slug, name },
      professionals: createdProfessionals,
      services: createdServices,
    })
  } catch (error) {
    console.error('[TENANT_CREATE_ERROR]', error)
    return NextResponse.json({ error: 'Erro ao criar barbearia' }, { status: 500 })
  }
}

// GET /api/tenants — listar tenants (para admin)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const tenants = await prisma.tenant.findMany({
      include: {
        subscription: true,
        _count: { select: { clients: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tenants)
  } catch (error) {
    console.error('[TENANTS_GET_ERROR]', error)
    return NextResponse.json({ error: 'Erro ao buscar barbearias' }, { status: 500 })
  }
}
