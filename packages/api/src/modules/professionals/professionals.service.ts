import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { SupabaseMetadataService } from '../../common/auth/supabase-metadata.service'
import { CreateProfessionalDto } from './dto/create-professional.dto'
import { UpdateProfessionalDto } from './dto/update-professional.dto'
import { CreateInviteDto } from './dto/create-invite.dto'

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

  /**
   * Convida um barbeiro: cria/reusa a conta Supabase do email, vincula como
   * `barbeiro` no tenant, liga ao Professional e popula o `app_metadata`
   * (role/tenantSlug/professionalId/professionalName) pro web rotear o painel.
   * Requer service_role no runtime.
   */
  async invite(dto: CreateInviteDto, tenant: { id: string; slug: string }) {
    if (!this.supabaseMetadata.enabled) {
      throw new ServiceUnavailableException(
        'Convite indisponível: auth admin (service_role) não configurado',
      )
    }

    const prof = await this.prisma.professional.findFirst({
      where: { id: dto.professionalId, tenantId: tenant.id },
      select: { id: true, name: true, userId: true },
    })
    if (!prof) throw new NotFoundException('Profissional não encontrado')
    if (prof.userId) {
      throw new ConflictException('Este profissional já tem um login vinculado')
    }

    const email = dto.email.toLowerCase().trim()

    // Reusa User existente por email; senão convida (cria conta Supabase) + cria User.
    let user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, supabaseId: true },
    })
    let supabaseId = user?.supabaseId ?? null

    if (!user || !supabaseId) {
      const invited = await this.supabaseMetadata.inviteUser(email, { name: dto.name })
      if (!invited) {
        throw new ServiceUnavailableException(
          'Não foi possível criar o login do barbeiro (e-mail já em uso ou envio de e-mail não configurado)',
        )
      }
      supabaseId = invited.id
      user = user
        ? await this.prisma.user.update({
            where: { id: user.id },
            data: { supabaseId },
            select: { id: true, supabaseId: true },
          })
        : await this.prisma.user.create({
            data: { supabaseId, email, name: dto.name },
            select: { id: true, supabaseId: true },
          })
    }

    // Membership barbeiro (idempotente) + vínculo Professional↔User + email no Professional.
    await this.prisma.tenantUser.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      create: { tenantId: tenant.id, userId: user.id, role: 'barbeiro', active: true },
      update: { role: 'barbeiro', active: true },
    })
    await this.prisma.professional.updateMany({
      where: { id: prof.id, tenantId: tenant.id },
      data: { userId: user.id, email },
    })

    await this.supabaseMetadata.setAppMetadata(supabaseId, {
      role: 'barbeiro',
      tenantSlug: tenant.slug,
      professionalId: prof.id,
      professionalName: prof.name,
    })

    return { ok: true, professionalId: prof.id }
  }
}
