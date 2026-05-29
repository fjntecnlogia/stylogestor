import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { SupabaseMetadataService } from '../../common/auth/supabase-metadata.service'
import { CreateProfessionalDto } from './dto/create-professional.dto'
import { UpdateProfessionalDto } from './dto/update-professional.dto'

@Injectable()
export class ProfessionalsService {
  constructor(
    private prisma: PrismaService,
    private supabaseMetadata: SupabaseMetadataService,
  ) {}

  /**
   * Lista profissionais do tenant. Por padrão só os ativos; `includeInactive=true`
   * traz todos (tela do gestor, pra ligar/desligar/reativar).
   */
  findAll(tenantId: string, includeInactive = false) {
    return this.prisma.professional.findMany({
      where: { tenantId, ...(includeInactive ? {} : { active: true }) },
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

  /**
   * Soft-delete: marca `active: false` em vez de remover, porque agendamentos
   * referenciam o profissional. Mesmo padrão do módulo Services. Pra reativar,
   * usar PATCH com `active: true` (some da listagem padrão; aparece com
   * `includeInactive=true`).
   */
  async remove(id: string, tenantId: string) {
    const updated = await this.prisma.professional.updateMany({
      where: { id, tenantId },
      data: { active: false },
    })
    if (updated.count === 0) {
      throw new NotFoundException('Profissional não encontrado')
    }
  }

  /**
   * Gestor redefine a senha do login (Supabase) de um profissional do seu tenant.
   * Resolve o login do barbeiro pelo email do Professional (gravado no invite)
   * → User.supabaseId → admin.setPassword. Requer service_role no runtime.
   */
  async resetPassword(id: string, tenantId: string, password: string) {
    const prof = await this.prisma.professional.findFirst({
      where: { id, tenantId },
      select: { id: true, email: true },
    })
    if (!prof) throw new NotFoundException('Profissional não encontrado')
    if (!prof.email) {
      throw new BadRequestException(
        'Profissional sem email — não dá pra localizar o login dele',
      )
    }
    const user = await this.prisma.user.findUnique({
      where: { email: prof.email },
      select: { supabaseId: true },
    })
    if (!user?.supabaseId) {
      throw new NotFoundException(
        'Login do profissional não encontrado (ainda não foi convidado?)',
      )
    }
    const res = await this.supabaseMetadata.setPassword(user.supabaseId, password)
    if (!res.ok) {
      throw new ServiceUnavailableException('Não foi possível redefinir a senha agora')
    }
    return { ok: true }
  }
}
