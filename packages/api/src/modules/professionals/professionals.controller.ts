import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { ProfessionalsService } from './professionals.service'
import { CreateProfessionalDto } from './dto/create-professional.dto'
import { UpdateProfessionalDto } from './dto/update-professional.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { CreateInviteDto } from './dto/create-invite.dto'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { TenantThrottleGuard } from '../../common/guards/tenant-throttle.guard'
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor'
import { CurrentTenant, TenantPayload } from '../../common/decorators/current-tenant.decorator'

@ApiTags('Professionals') @ApiBearerAuth()
@UseGuards(TenantGuard, TenantThrottleGuard) @UseInterceptors(TenantContextInterceptor)
@Controller('professionals')
export class ProfessionalsController {
  constructor(private service: ProfessionalsService) {}

  @Get()
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(
    @CurrentTenant() t: TenantPayload,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.service.findAll(t.id, includeInactive === 'true')
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() t: TenantPayload) {
    return this.service.findOne(id, t.id)
  }

  @Post()
  create(@Body() dto: CreateProfessionalDto, @CurrentTenant() t: TenantPayload) {
    return this.service.create(dto, t.id)
  }

  /** Convida um barbeiro (cria login Supabase + vincula ao Professional). */
  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  invite(@Body() dto: CreateInviteDto, @CurrentTenant() t: TenantPayload) {
    return this.service.invite(dto, { id: t.id, slug: t.slug })
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProfessionalDto,
    @CurrentTenant() t: TenantPayload,
  ) {
    return this.service.update(id, dto, t.id)
  }

  /** Soft-delete (marca active:false). Pra reativar, PATCH com active:true. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentTenant() t: TenantPayload) {
    return this.service.remove(id, t.id)
  }

  /** Gestor redefine a senha do login (Supabase) do profissional. */
  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentTenant() t: TenantPayload,
  ) {
    return this.service.resetPassword(id, t.id, dto.password)
  }
}
