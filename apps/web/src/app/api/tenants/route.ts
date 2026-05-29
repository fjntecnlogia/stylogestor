import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'
import { prisma, getSetting, SETTING_KEYS } from '@stylogestor/database'
import { sendWelcomeEmail } from '@/lib/resend'
import { sendWhatsApp, msgWelcomeGestor } from '@/lib/whatsapp'

// POST /api/tenants — criar tenant no onboarding
export async function POST(req: NextRequest) {
  try {
    const authUser = await getServerUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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

    // Vincular usuário (Supabase) ao tenant
    const dbUser = await prisma.user.upsert({
      where: { supabaseId: authUser.id },
      create: {
        supabaseId: authUser.id,
        email: authUser.email ?? `${authUser.id}@user.temp`,
        name,
      },
      update: {},
    })
    await prisma.tenantUser.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: dbUser.id } },
      create: { tenantId: tenant.id, userId: dbUser.id, role: 'owner' },
      update: {},
    })

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

    // app_metadata (tenantSlug/tenantName/role/subscriptionStatus) é setado
    // pelo BACKEND (service role) — ver docs/BACKEND_FASE3_APP_METADATA.md.
    // O web não tem service role (decisão Fase 3). Enquanto o backend não
    // popular: o middleware trata role indefinido como 'gestor' e sem
    // subscriptionStatus como não-bloqueado, e o auth-tenant resolve o tenant
    // por supabaseId/email — então o onboarding funciona. O client chama
    // refreshUser() após o POST; quando o backend setar o metadata, o slug
    // aparece no JWT (necessário só pro localStorage scoped por tenant).
    // TODO(backend): POST /tenants do NestJS deve setar app_metadata do criador.
    const userEmail: string | null = authUser.email ?? null

    // Email de boas-vindas — disparo non-blocking (não falha o POST
    // se o Resend tiver fora do ar / API key não setada).
    if (userEmail) {
      sendWelcomeEmail(userEmail, name).catch((err) =>
        console.error('[WELCOME_EMAIL_ERROR]', err),
      )
    }

    // WhatsApp de boas-vindas — non-blocking. Mesmo phone usado no
    // cadastro da barbearia. Se phone vazio ou WhatsApp não configurado,
    // só loga e segue.
    if (phone) {
      sendWhatsApp({
        phone,
        message: msgWelcomeGestor({ tenantName: name, trialDays }),
      }).catch((err) => console.error('[WELCOME_WHATSAPP_ERROR]', err))
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
export async function GET(_req: NextRequest) {
  try {
    const authUser = await getServerUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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
