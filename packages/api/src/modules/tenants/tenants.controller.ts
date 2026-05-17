import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { TenantsService } from './tenants.service'
import { UpdateTenantDto } from './dto/update-tenant.dto'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentTenant, TenantPayload } from '../../common/decorators/current-tenant.decorator'

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @UseInterceptors(TenantContextInterceptor)
  @Get('me')
  getMe(@CurrentTenant() tenant: TenantPayload) {
    return this.tenantsService.findById(tenant.id)
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @UseInterceptors(TenantContextInterceptor)
  @Get('me/dashboard')
  getDashboard(@CurrentTenant() tenant: TenantPayload) {
    return this.tenantsService.getDashboardStats(tenant.id)
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @UseInterceptors(TenantContextInterceptor)
  @Patch('me')
  update(@CurrentTenant() tenant: TenantPayload, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(tenant.id, dto)
  }

  /**
   * Resolução de slug → tenant (usado pelo middleware Next.js).
   *
   * - @Public: sem JWT (executa antes da auth do usuário).
   * - Protegida por `x-internal-secret` compartilhado com o middleware.
   * - Retorna apenas campos seguros (sem email/phone/settings).
   * - Bug anterior: usava @Body em GET — agora @Param.
   */
  @Public()
  @Get('by-slug/:slug')
  findBySlug(
    @Param('slug') slug: string,
    @Headers('x-internal-secret') internalSecret?: string,
  ) {
    const expected = process.env.INTERNAL_SECRET
    if (!expected || internalSecret !== expected) {
      throw new ForbiddenException('Acesso interno apenas')
    }
    return this.tenantsService.findBySlugPublic(slug)
  }
}
