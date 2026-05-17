import { Controller, Get, Post, Patch, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ProfessionalsService } from './professionals.service'
import { CreateProfessionalDto } from './dto/create-professional.dto'
import { UpdateProfessionalDto } from './dto/update-professional.dto'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor'
import { CurrentTenant, TenantPayload } from '../../common/decorators/current-tenant.decorator'

@ApiTags('Professionals') @ApiBearerAuth()
@UseGuards(TenantGuard) @UseInterceptors(TenantContextInterceptor)
@Controller('professionals')
export class ProfessionalsController {
  constructor(private service: ProfessionalsService) {}

  @Get()
  findAll(@CurrentTenant() t: TenantPayload) {
    return this.service.findAll(t.id)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() t: TenantPayload) {
    return this.service.findOne(id, t.id)
  }

  @Post()
  create(@Body() dto: CreateProfessionalDto, @CurrentTenant() t: TenantPayload) {
    return this.service.create(dto, t.id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProfessionalDto,
    @CurrentTenant() t: TenantPayload,
  ) {
    return this.service.update(id, dto, t.id)
  }
}
