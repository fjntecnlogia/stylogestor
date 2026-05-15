import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@stylogestor/database'

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

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name,
        type: type ?? 'barbershop',
        phone,
        email: undefined,
        plan: (plan as 'FREE' | 'STARTER' | 'PRO' | 'PREMIUM') ?? 'FREE',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias
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

    return NextResponse.json({ ok: true, tenant: { id: tenant.id, slug, name } })
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
