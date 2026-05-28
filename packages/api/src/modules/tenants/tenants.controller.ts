import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { TenantsService } from './tenants.service'
import { UpdateTenantDto } from './dto/update-tenant.dto'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { TenantThrottleGuard } from '../../common/guards/tenant-throttle.guard'
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentTenant, TenantPayload } from '../../common/decorators/current-tenant.decorator'
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * Bootstrap do app (pós-login): lista as barbearias do usuário autenticado.
   * SEM TenantGuard — funciona pra usuário ainda sem tenant (retorna []).
   * Mobile usa o `slug` retornado como header `x-tenant-slug` nas demais rotas.
   */
  @ApiBearerAuth()
  @Get('mine')
  getMine(@CurrentUser() user: AuthUser) {
    return this.tenantsService.getMyMemberships(user.id)
  }

  /**
   * Onboarding: cria a barbearia e vincula o usuário como `owner`.
   * SEM TenantGuard — é justamente o passo que dá um tenant ao usuário.
   */
  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTenantDto) {
    return this.tenantsService.createForUser(user.id, dto)
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard, TenantThrottleGuard)
  @UseInterceptors(TenantContextInterceptor)
  @Get('me')
  getMe(@CurrentTenant() tenant: TenantPayload) {
    return this.tenantsService.findById(tenant.id)
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard, TenantThrottleGuard)
  @UseInterceptors(TenantContextInterceptor)
  @Get('me/dashboard')
  getDashboard(@CurrentTenant() tenant: TenantPayload) {
    return this.tenantsService.getDashboardStats(tenant.id)
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard, TenantThrottleGuard)
  @UseInterceptors(TenantContextInterceptor)
  @Patch('me')
  update(@CurrentTenant() tenant: TenantPayload, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(tenant.id, dto)
  }

  /**
   * Resolução de slug → tenant (usado pelo middleware Next.js).
   *
   * - @Public: sem JWT (executa antes da auth do usuário).
   * - Protegida por `x-internal-key` compartilhado com o middleware (env INTERNAL_API_KEY).
   * - Retorna apenas campos seguros (sem email/phone/settings).
   * - Bug anterior: usava @Body em GET — agora @Param.
   */
  @Public()
  @Get('by-slug/:slug')
  findBySlug(
    @Param('slug') slug: string,
    @Headers('x-internal-key') internalKey?: string,
  ) {
    const expected = process.env.INTERNAL_API_KEY
    if (!expected || internalKey !== expected) {
      throw new ForbiddenException('Acesso interno apenas')
    }
    return this.tenantsService.findBySlugPublic(slug)
  }
}
