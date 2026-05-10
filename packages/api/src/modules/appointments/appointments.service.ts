import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { UpdateAppointmentDto } from './dto/update-appointment.dto'

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    filters: { date?: string; professionalId?: string; status?: string },
  ) {
    const where: Record<string, unknown> = { tenantId }
    if (filters.date) {
      const d = new Date(filters.date)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      where.date = { gte: d, lt: next }
    }
    if (filters.professionalId) where.professionalId = filters.professionalId
    if (filters.status) where.status = filters.status

    return this.prisma.appointment.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        professional: { select: { id: true, name: true, avatar: true } },
        services: { include: { service: true } },
      },
      orderBy: { startTime: 'asc' },
    })
  }

  async findOne(id: string, tenantId: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        professional: true,
        services: { include: { service: true } },
        payments: true,
      },
    })
    if (!appt) throw new NotFoundException('Agendamento não encontrado')
    return appt
  }

  async create(dto: CreateAppointmentDto, tenantId: string) {
    // Verificar conflito de horário
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        professionalId: dto.professionalId,
        status: { notIn: ['CANCELED', 'NO_SHOW'] },
        OR: [
          { startTime: { gte: new Date(dto.startTime), lt: new Date(dto.endTime) } },
          { endTime: { gt: new Date(dto.startTime), lte: new Date(dto.endTime) } },
        ],
      },
    })
    if (conflict) throw new ConflictException('Horário já ocupado para este profissional')

    return this.prisma.appointment.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        professionalId: dto.professionalId,
        date: new Date(dto.startTime),
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        totalPrice: dto.totalPrice,
        totalDuration: dto.totalDuration,
        notes: dto.notes,
        source: dto.source ?? 'manual',
        services: {
          create: dto.serviceIds.map((sid) => ({
            serviceId: sid,
            price: 0, // atualizado após buscar serviços
            duration: 0,
          })),
        },
      },
      include: { services: true },
    })
  }

  async update(id: string, dto: UpdateAppointmentDto, tenantId: string) {
    await this.findOne(id, tenantId)
    return this.prisma.appointment.update({ where: { id }, data: dto })
  }

  async updateStatus(id: string, status: string, tenantId: string, cancelReason?: string) {
    await this.findOne(id, tenantId)
    return this.prisma.appointment.update({
      where: { id },
      data: { status: status as never, cancelReason },
    })
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId)
    return this.prisma.appointment.delete({ where: { id } })
  }

  async getAvailableSlots(tenantId: string, date: string, professionalId: string) {
    const schedule = await this.prisma.professionalSchedule.findFirst({
      where: { professionalId, dayOfWeek: new Date(date).getDay(), active: true },
    })
    if (!schedule) return []

    const booked = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        professionalId,
        date: new Date(date),
        status: { notIn: ['CANCELED', 'NO_SHOW'] },
      },
      select: { startTime: true, endTime: true },
    })

    // Gera slots de 30 em 30 minutos no horário do profissional
    const slots: string[] = []
    const [startH, startM] = schedule.startTime.split(':').map(Number)
    const [endH, endM] = schedule.endTime.split(':').map(Number)
    const startMin = startH * 60 + startM
    const endMin = endH * 60 + endM

    for (let m = startMin; m < endMin; m += 30) {
      const slotDate = new Date(date)
      slotDate.setHours(Math.floor(m / 60), m % 60, 0, 0)
      const isBooked = booked.some(
        (b) => slotDate >= new Date(b.startTime) && slotDate < new Date(b.endTime),
      )
      if (!isBooked) slots.push(slotDate.toISOString())
    }

    return slots
  }
}
