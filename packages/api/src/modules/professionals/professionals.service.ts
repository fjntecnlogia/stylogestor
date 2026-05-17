import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreateProfessionalDto } from './dto/create-professional.dto'
import { UpdateProfessionalDto } from './dto/update-professional.dto'

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

  create(dto: CreateProfessionalDto, tenantId: string) {
    return this.prisma.professional.create({
      data: { ...dto, tenantId },
    })
  }

  async update(id: string, dto: UpdateProfessionalDto, tenantId: string) {
    const updated = await this.prisma.professional.updateMany({
      where: { id, tenantId },
      data: dto,
    })
    if (updated.count === 0) {
      throw new NotFoundException('Profissional não encontrado')
    }
    return this.findOne(id, tenantId)
  }
}
