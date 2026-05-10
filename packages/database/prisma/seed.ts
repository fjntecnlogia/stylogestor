import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do STYLOGESTOR...')

  // ── Tenant demo ────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    create: {
      slug: 'demo',
      name: 'Barbearia do João',
      type: 'barbershop',
      phone: '(11) 99999-0000',
      email: 'joao@barbearia.com',
      plan: 'PRO',
      address: { street: 'Rua das Flores', number: '123', city: 'São Paulo', state: 'SP', zip: '01310-100' },
      settings: { primaryColor: '#1A3A6B', confirmationMessage: true, reminderMessage: true },
    },
    update: {},
  })
  console.log(`✅ Tenant: ${tenant.name} (${tenant.slug})`)

  // ── Horários de funcionamento ──────────────────────────────
  const scheduleData = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '19:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '19:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '19:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '19:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '19:00' },
    { dayOfWeek: 6, startTime: '09:00', endTime: '17:00' },
  ]
  await prisma.businessSchedule.deleteMany({ where: { tenantId: tenant.id } })
  await prisma.businessSchedule.createMany({
    data: scheduleData.map((s) => ({ ...s, tenantId: tenant.id })),
  })
  console.log('✅ Horários de funcionamento criados')

  // ── Profissionais ──────────────────────────────────────────
  const joao = await prisma.professional.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      tenantId: tenant.id,
      name: 'João Silva',
      role: 'barber',
      phone: '(11) 99999-0001',
      email: 'joao@barbearia.com',
      commission: 40,
    },
    update: {},
  })

  const pedro = await prisma.professional.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      tenantId: tenant.id,
      name: 'Pedro Costa',
      role: 'hairdresser',
      phone: '(11) 99999-0002',
      commission: 35,
    },
    update: {},
  })
  console.log('✅ Profissionais criados')

  // Horários dos profissionais
  for (const prof of [joao, pedro]) {
    await prisma.professionalSchedule.deleteMany({ where: { professionalId: prof.id } })
    await prisma.professionalSchedule.createMany({
      data: [1, 2, 3, 4, 5, 6].map((day) => ({
        professionalId: prof.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: day === 6 ? '17:00' : '18:00',
      })),
    })
  }

  // ── Serviços ───────────────────────────────────────────────
  const servicesData = [
    { name: 'Corte masculino', price: 40,  duration: 30, category: 'Corte',     color: '#1A3A6B' },
    { name: 'Barba',           price: 30,  duration: 30, category: 'Barba',     color: '#F5A623' },
    { name: 'Corte + Barba',   price: 60,  duration: 45, category: 'Corte',     color: '#1A3A6B' },
    { name: 'Pigmentação',     price: 80,  duration: 60, category: 'Coloração', color: '#8B5CF6' },
    { name: 'Hidratação',      price: 70,  duration: 45, category: 'Tratamento',color: '#06B6D4' },
    { name: 'Sobrancelha',     price: 20,  duration: 15, category: 'Outros',    color: '#EC4899' },
  ]

  await prisma.service.deleteMany({ where: { tenantId: tenant.id } })
  const services = await Promise.all(
    servicesData.map((s) => prisma.service.create({ data: { ...s, tenantId: tenant.id } }))
  )
  console.log(`✅ ${services.length} serviços criados`)

  // ── Produtos (Estoque) ─────────────────────────────────────
  await prisma.product.deleteMany({ where: { tenantId: tenant.id } })
  await prisma.product.createMany({
    data: [
      { tenantId: tenant.id, name: 'Pomada modeladora',   sku: 'PM001', price: 35, cost: 18, stock: 12, minStock: 5,  category: 'Finalizador' },
      { tenantId: tenant.id, name: 'Shampoo profissional', sku: 'SH002', price: 45, cost: 22, stock: 3,  minStock: 5,  category: 'Lavagem'    },
      { tenantId: tenant.id, name: 'Óleo de barba',        sku: 'OB003', price: 55, cost: 28, stock: 8,  minStock: 3,  category: 'Barba'      },
      { tenantId: tenant.id, name: 'Cera de cabelo',       sku: 'CE005', price: 30, cost: 14, stock: 2,  minStock: 5,  category: 'Finalizador' },
    ],
  })
  console.log('✅ Produtos criados')

  // ── Clientes ───────────────────────────────────────────────
  await prisma.client.deleteMany({ where: { tenantId: tenant.id } })
  const clientsData = [
    { name: 'Carlos Oliveira', phone: '11999990001', email: 'carlos@email.com',  totalVisits: 12, totalSpent: 720 },
    { name: 'Rafael Santos',   phone: '11999990002', email: '',                  totalVisits: 5,  totalSpent: 200 },
    { name: 'Pedro Alves',     phone: '11999990003', email: 'pedro@email.com',   totalVisits: 23, totalSpent: 1380, tags: ['vip', 'mensal'] },
    { name: 'Lucas Ferreira',  phone: '11999990004', email: '',                  totalVisits: 3,  totalSpent: 120 },
    { name: 'André Lima',      phone: '11999990005', email: 'andre@email.com',   totalVisits: 8,  totalSpent: 480, tags: ['mensal'] },
    { name: 'Bruno Carvalho',  phone: '11999990006', email: '',                  totalVisits: 1,  totalSpent: 40  },
  ]
  const clients = await Promise.all(
    clientsData.map((c) => prisma.client.create({ data: { ...c, tenantId: tenant.id, tags: c.tags ?? [] } }))
  )
  console.log(`✅ ${clients.length} clientes criados`)

  // ── Agendamentos de hoje ───────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const apptData = [
    { clientIdx: 0, profIdx: 0, hour: 9,  min: 0,  serviceIdx: 0, status: 'COMPLETED' as const },
    { clientIdx: 1, profIdx: 0, hour: 9,  min: 30, serviceIdx: 1, status: 'COMPLETED' as const },
    { clientIdx: 2, profIdx: 1, hour: 10, min: 0,  serviceIdx: 2, status: 'COMPLETED' as const },
    { clientIdx: 3, profIdx: 0, hour: 14, min: 0,  serviceIdx: 0, status: 'CONFIRMED' as const },
    { clientIdx: 4, profIdx: 1, hour: 14, min: 30, serviceIdx: 1, status: 'SCHEDULED' as const },
    { clientIdx: 5, profIdx: 0, hour: 15, min: 0,  serviceIdx: 2, status: 'SCHEDULED' as const },
  ]

  const professionals = [joao, pedro]
  for (const a of apptData) {
    const startTime = new Date(today)
    startTime.setHours(a.hour, a.min, 0, 0)
    const svc = services[a.serviceIdx]
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + svc.duration)

    const appt = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        clientId: clients[a.clientIdx].id,
        professionalId: professionals[a.profIdx].id,
        date: today,
        startTime,
        endTime,
        status: a.status,
        totalPrice: svc.price,
        totalDuration: svc.duration,
        source: 'manual',
        services: { create: [{ serviceId: svc.id, price: svc.price, duration: svc.duration }] },
      },
    })

    // Cria transação para os concluídos
    if (a.status === 'COMPLETED') {
      await prisma.transaction.create({
        data: {
          tenantId: tenant.id,
          type: 'INCOME',
          category: 'Serviço',
          description: `${svc.name} — ${clients[a.clientIdx].name}`,
          amount: svc.price,
          date: today,
          paymentMethod: 'PIX',
          appointmentId: appt.id,
          status: 'confirmed',
        },
      })

      // Comissão
      const profCommission = professionals[a.profIdx].commission
      await prisma.commission.create({
        data: {
          appointmentId: appt.id,
          professionalId: professionals[a.profIdx].id,
          tenantId: tenant.id,
          baseAmount: svc.price,
          percentage: profCommission,
          commissionAmount: (svc.price * profCommission) / 100,
        },
      })
    }
  }
  console.log('✅ Agendamentos e transações criados')

  // ── Assinatura ─────────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      plan: 'PRO',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {},
  })
  console.log('✅ Assinatura criada')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log(`\n📋 Dados criados:`)
  console.log(`   Tenant: demo.stylogestor.com.br`)
  console.log(`   Profissionais: 2 (João + Pedro)`)
  console.log(`   Serviços: ${services.length}`)
  console.log(`   Clientes: ${clients.length}`)
  console.log(`   Agendamentos hoje: ${apptData.length}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
