import { Controller, Get, Patch, Body, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { TenantsService } from './tenants.service'
import { UpdateTenantDto } from './dto/update-tenant.dto'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor'
import { CurrentTenant, TenantPayload } from '../../common/decorators/current-tenant.decorator'

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@UseInterceptors(TenantContextInterceptor)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  getMe(@CurrentTenant() tenant: TenantPayload) {
    return this.tenantsService.findById(tenant.id)
  }

  @Get('me/dashboard')
  getDashboard(@CurrentTenant() tenant: TenantPayload) {
    return this.tenantsService.getDashboardStats(tenant.id)
  }

  @Patch('me')
  update(@CurrentTenant() tenant: TenantPayload, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(tenant.id, dto)
  }

  // Rota pública para o middleware Next.js buscar tenant por slug
  @Get('by-slug/:slug')
  findBySlug(@Body() params: { slug: string }) {
    return this.tenantsService.findBySlug(params.slug)
  }
}
