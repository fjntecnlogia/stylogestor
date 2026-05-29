import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { SupabaseMetadataService } from '../../common/auth/supabase-metadata.service'

/**
 * Operações user-scoped (não-tenant) que dependem de escrita admin no Supabase
 * (`app_metadata`). O web não tem service role (decisão Fase 3), então essas
 * operações vivem aqui no backend. Ver docs/BACKEND_FASE3_APP_METADATA.md.
 */
@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseMetadata: SupabaseMetadataService,
  ) {}

  /** Marca o tour de UI como concluído (lido pelo <DashboardTour /> no web). */
  async markTourCompleted(supabaseId: string | null) {
    await this.supabaseMetadata.setAppMetadata(supabaseId, { tourCompleted: true })
    return { ok: true }
  }

  /**
   * Reset de onboarding (ferramenta de recuperação da página /reset-conta):
   * desativa as memberships do usuário (volta pro fluxo de onboarding) e limpa
   * os claims fantasma do `app_metadata` (ex.: tenantSlug apontando pra tenant
   * deletado). Mantém `tourCompleted` (flag de UI, não é estado de onboarding).
   */
  async resetOnboarding(userId: string, supabaseId: string | null) {
    await this.prisma.tenantUser.updateMany({
      where: { userId, active: true },
      data: { active: false },
    })
    await this.supabaseMetadata.clearAppMetadata(supabaseId, [
      'role',
      'tenantSlug',
      'tenantName',
      'subscriptionStatus',
      'professionalId',
      'professionalName',
    ])
    return { ok: true }
  }
}
