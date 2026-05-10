import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreateClientDto } from './dto/create-client.dto'

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  findAll(tenantId: string, search?: string) {
    return this.prisma.client.findMany({
      where: {
        tenantId,
        active: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string, tenantId: string) {
    const c = await this.prisma.client.findFirst({ where: { id, tenantId } })
    if (!c) throw new NotFoundException('Cliente não encontrado')
    return c
  }

  getHistory(id: string, tenantId: string) {
    return this.prisma.appointment.findMany({
      where: { clientId: id, tenantId },
      include: { services: { include: { service: true } }, professional: true },
      orderBy: { startTime: 'desc' },
      take: 50,
    })
  }

  create(dto: CreateClientDto, tenantId: string) {
    return this.prisma.client.create({ data: { ...dto, tenantId } })
  }

  async update(id: string, dto: Partial<CreateClientDto>, tenantId: string) {
    await this.findOne(id, tenantId)
    return this.prisma.client.update({ where: { id }, data: dto })
  }
}
