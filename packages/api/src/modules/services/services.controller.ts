import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ServicesService } from './services.service'
import { CreateServiceDto } from './dto/create-service.dto'
import { UpdateServiceDto } from './dto/update-service.dto'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { TenantThrottleGuard } from '../../common/guards/tenant-throttle.guard'
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor'
import { CurrentTenant, TenantPayload } from '../../common/decorators/current-tenant.decorator'

@ApiTags('Services') @ApiBearerAuth()
@UseGuards(TenantGuard, TenantThrottleGuard) @UseInterceptors(TenantContextInterceptor)
@Controller('services')
export class ServicesController {
  constructor(private service: ServicesService) {}

  @Get()
  findAll(@CurrentTenant() t: TenantPayload) {
    return this.service.findAll(t.id)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() t: TenantPayload) {
    return this.service.findOne(id, t.id)
  }

  @Post()
  create(@Body() dto: CreateServiceDto, @CurrentTenant() t: TenantPayload) {
    return this.service.create(dto, t.id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentTenant() t: TenantPayload,
  ) {
    return this.service.update(id, dto, t.id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentTenant() t: TenantPayload) {
    return this.service.remove(id, t.id)
  }
}
