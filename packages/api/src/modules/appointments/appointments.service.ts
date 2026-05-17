import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, AppointmentStatus } from '@prisma/client'
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
    const where: Prisma.AppointmentWhereInput = { tenantId }
    if (filters.date) {
      const d = new Date(filters.date)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      where.date = { gte: d, lt: next }
    }
    if (filters.professionalId) where.professionalId = filters.professionalId
    if (filters.status && filters.status in AppointmentStatus) {
      where.status = filters.status as AppointmentStatus
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } }, // phone removido: PII desnecessária na listagem
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
    const start = new Date(dto.startTime)
    const end = new Date(dto.endTime)

    if (!(start < end)) {
      throw new ConflictException('startTime deve ser anterior a endTime')
    }

    // Checagem + criação em UMA transação Serializable para evitar race:
    // dois POSTs simultâneos não podem mais criar overlap.
    return this.prisma.$transaction(
      async (tx) => {
        // Lógica correta de overlap: existing.start < new.end AND existing.end > new.start.
        // Cobre todos os 4 casos (engloba, é englobado, sobrepõe início, sobrepõe fim).
        const conflict = await tx.appointment.findFirst({
          where: {
            tenantId,
            professionalId: dto.professionalId,
            status: { notIn: [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW] },
            startTime: { lt: end },
            endTime: { gt: start },
          },
          select: { id: true },
        })
        if (conflict) {
          throw new ConflictException('Horário já ocupado para este profissional')
        }

        return tx.appointment.create({
          data: {
            tenantId,
            clientId: dto.clientId,
            professionalId: dto.professionalId,
            date: start,
            startTime: start,
            endTime: end,
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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  async update(id: string, dto: UpdateAppointmentDto, tenantId: string) {
    // updateMany com filtro composto: garante multi-tenant no nível da query.
    // Se 0 linhas afetadas, lança NotFound em vez de update silencioso.
    const updated = await this.prisma.appointment.updateMany({
      where: { id, tenantId },
      data: dto,
    })
    if (updated.count === 0) {
      throw new NotFoundException('Agendamento não encontrado')
    }
    return this.findOne(id, tenantId)
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    tenantId: string,
    cancelReason?: string,
  ) {
    const updated = await this.prisma.appointment.updateMany({
      where: { id, tenantId },
      data: { status, cancelReason },
    })
    if (updated.count === 0) {
      throw new NotFoundException('Agendamento não encontrado')
    }
    return this.findOne(id, tenantId)
  }

  async remove(id: string, tenantId: string) {
    const deleted = await this.prisma.appointment.deleteMany({
      where: { id, tenantId },
    })
    if (deleted.count === 0) {
      throw new NotFoundException('Agendamento não encontrado')
    }
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
        status: { notIn: [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW] },
      },
      select: { startTime: true, endTime: true },
    })

    // Gera slots de 30 em 30 minutos no horário do profissional
    // NOTA: a duração do serviço pretendido NÃO é considerada aqui — bug funcional
    // documentado na auditoria, fora do escopo desta passagem.
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
