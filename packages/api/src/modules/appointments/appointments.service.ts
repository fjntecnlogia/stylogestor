import {
  BadRequestException,
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

        // Snapshot de preço/duração POR serviço: grava o valor vigente no
        // momento do agendamento (preço histórico), não 0. Buscar dentro da
        // transação garante consistência e valida que cada serviceId pertence
        // ao tenant e está ativo (impede agendar serviço de outra barbearia).
        const services = await tx.service.findMany({
          where: { id: { in: dto.serviceIds }, tenantId, active: true },
          select: { id: true, price: true, duration: true },
        })
        const serviceMap = new Map(services.map((s) => [s.id, s]))
        const invalid = dto.serviceIds.filter((sid) => !serviceMap.has(sid))
        if (invalid.length > 0) {
          throw new BadRequestException(
            `Serviço(s) inválido(s) ou inativo(s): ${invalid.join(', ')}`,
          )
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
              create: dto.serviceIds.map((sid) => {
                const svc = serviceMap.get(sid)!
                return { serviceId: sid, price: svc.price, duration: svc.duration }
              }),
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

  /**
   * Slots disponíveis para um profissional em uma data.
   *
   * @param tenantId       tenant scope
   * @param date           ISO date (YYYY-MM-DD)
   * @param professionalId profissional a checar
   * @param serviceIds     opcional: serviços que o cliente quer agendar.
   *                       A duração total deles vira o tamanho mínimo do slot,
   *                       e o slot só é oferecido se [slot, slot+duração]
   *                       couber sem overlapar com nenhum agendamento existente
   *                       nem com o horário de almoço do profissional.
   *
   * Slots são gerados de 30 em 30 min (granularidade comercial padrão).
   * Slot final precisa caber inteiramente dentro do horário do profissional.
   */
  async getAvailableSlots(
    tenantId: string,
    date: string,
    professionalId: string,
    serviceIds?: string[],
  ) {
    const schedule = await this.prisma.professionalSchedule.findFirst({
      where: { professionalId, dayOfWeek: new Date(date).getDay(), active: true },
    })
    if (!schedule) return []

    // Duração total dos serviços (somatório). Default 30 min se nenhum serviço passado.
    let durationMinutes = 30
    if (serviceIds && serviceIds.length > 0) {
      const services = await this.prisma.service.findMany({
        where: { id: { in: serviceIds }, tenantId, active: true },
        select: { duration: true },
      })
      if (services.length === 0) return [] // serviços inválidos → sem slots
      durationMinutes = services.reduce((sum, s) => sum + s.duration, 0)
    }

    const booked = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        professionalId,
        date: new Date(date),
        status: { notIn: [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW] },
      },
      select: { startTime: true, endTime: true },
    })

    const [startH, startM] = schedule.startTime.split(':').map(Number)
    const [endH, endM] = schedule.endTime.split(':').map(Number)
    const startMin = startH * 60 + startM
    const endMin = endH * 60 + endM

    // Janela de almoço (opcional) — slots que overlapam com ela são bloqueados
    const lunchStart = schedule.lunchStart
      ? (() => {
          const [h, m] = schedule.lunchStart!.split(':').map(Number)
          return h * 60 + m
        })()
      : null
    const lunchEnd = schedule.lunchEnd
      ? (() => {
          const [h, m] = schedule.lunchEnd!.split(':').map(Number)
          return h * 60 + m
        })()
      : null

    const slots: string[] = []
    const granularity = 30 // minutos

    for (let m = startMin; m + durationMinutes <= endMin; m += granularity) {
      const slotStart = new Date(date)
      slotStart.setHours(Math.floor(m / 60), m % 60, 0, 0)
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000)

      // 1. Overlap com agendamento existente? (mesma fórmula correta do create)
      const conflictsAppointment = booked.some(
        (b) =>
          new Date(b.startTime) < slotEnd && new Date(b.endTime) > slotStart,
      )
      if (conflictsAppointment) continue

      // 2. Overlap com almoço?
      if (lunchStart !== null && lunchEnd !== null) {
        const slotStartMin = m
        const slotEndMin = m + durationMinutes
        const overlapsLunch =
          slotStartMin < lunchEnd && slotEndMin > lunchStart
        if (overlapsLunch) continue
      }

      slots.push(slotStart.toISOString())
    }

    return slots
  }
}
