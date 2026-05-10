import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.professional.findMany({
      where: { tenantId, active: true },
      include: { schedules: true },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string, tenantId: string) {
    const p = await this.prisma.professional.findFirst({
      where: { id, tenantId },
      include: { schedules: true },
    })
    if (!p) throw new NotFoundException('Profissional não encontrado')
    return p
  }

  create(dto: Record<string, unknown>, tenantId: string) {
    return this.prisma.professional.create({ data: { ...(dto as never), tenantId } })
  }

  async update(id: string, dto: Record<string, unknown>, tenantId: string) {
    await this.findOne(id, tenantId)
    return this.prisma.professional.update({ where: { id }, data: dto as never })
  }
}
