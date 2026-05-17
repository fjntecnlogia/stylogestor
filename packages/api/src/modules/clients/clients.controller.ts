import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ClientsService } from './clients.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor'
import { CurrentTenant, TenantPayload } from '../../common/decorators/current-tenant.decorator'

@ApiTags('Clients') @ApiBearerAuth()
@UseGuards(TenantGuard) @UseInterceptors(TenantContextInterceptor)
@Controller('clients')
export class ClientsController {
  constructor(private service: ClientsService) {}

  @Get()
  findAll(@CurrentTenant() t: TenantPayload, @Query('search') search?: string) {
    return this.service.findAll(t.id, search)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() t: TenantPayload) {
    return this.service.findOne(id, t.id)
  }

  @Get(':id/history')
  history(@Param('id') id: string, @CurrentTenant() t: TenantPayload) {
    return this.service.getHistory(id, t.id)
  }

  @Post()
  create(@Body() dto: CreateClientDto, @CurrentTenant() t: TenantPayload) {
    return this.service.create(dto, t.id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentTenant() t: TenantPayload,
  ) {
    return this.service.update(id, dto, t.id)
  }
}
