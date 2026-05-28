import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreateServiceDto } from './dto/create-service.dto'
import { UpdateServiceDto } from './dto/update-service.dto'

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId, active: true },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string, tenantId: string) {
    const s = await this.prisma.service.findFirst({ where: { id, tenantId } })
    if (!s) throw new NotFoundException('Serviço não encontrado')
    return s
  }

  create(dto: CreateServiceDto, tenantId: string) {
    return this.prisma.service.create({ data: { ...dto, tenantId } })
  }

  async update(id: string, dto: UpdateServiceDto, tenantId: string) {
    const updated = await this.prisma.service.updateMany({
      where: { id, tenantId },
      data: dto,
    })
    if (updated.count === 0) throw new NotFoundException('Serviço não encontrado')
    return this.findOne(id, tenantId)
  }

  /**
   * Soft-delete: marca como inativo em vez de remover, porque agendamentos
   * antigos (AppointmentService) referenciam o serviço. `findAll` filtra
   * `active: true`, então some das listagens mas o histórico continua íntegro.
   */
  async remove(id: string, tenantId: string) {
    const updated = await this.prisma.service.updateMany({
      where: { id, tenantId },
      data: { active: false },
    })
    if (updated.count === 0) throw new NotFoundException('Serviço não encontrado')
  }
}
