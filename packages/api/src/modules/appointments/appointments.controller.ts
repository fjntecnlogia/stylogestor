import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { AppointmentsService } from './appointments.service'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { UpdateAppointmentDto } from './dto/update-appointment.dto'
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor'
import { CurrentTenant, TenantPayload } from '../../common/decorators/current-tenant.decorator'

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@UseInterceptors(TenantContextInterceptor)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Get()
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'professionalId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @CurrentTenant() tenant: TenantPayload,
    @Query('date') date?: string,
    @Query('professionalId') professionalId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(tenant.id, { date, professionalId, status })
  }

  @Get('availability')
  @ApiQuery({ name: 'date', required: true, description: 'ISO date YYYY-MM-DD' })
  @ApiQuery({ name: 'professionalId', required: true })
  @ApiQuery({
    name: 'serviceIds',
    required: false,
    description:
      'CSV de IDs de serviços. Se passado, a duração total deles dimensiona o slot e impede slots que conflitariam.',
  })
  getAvailability(
    @CurrentTenant() tenant: TenantPayload,
    @Query('date') date: string,
    @Query('professionalId') professionalId: string,
    @Query('serviceIds') serviceIds?: string,
  ) {
    const ids = serviceIds
      ? serviceIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined
    return this.service.getAvailableSlots(tenant.id, date, professionalId, ids)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenant: TenantPayload) {
    return this.service.findOne(id, tenant.id)
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentTenant() tenant: TenantPayload) {
    return this.service.create(dto, tenant.id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentTenant() tenant: TenantPayload,
  ) {
    return this.service.update(id, dto, tenant.id)
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateAppointmentStatusDto,
    @CurrentTenant() tenant: TenantPayload,
  ) {
    return this.service.updateStatus(id, body.status, tenant.id, body.cancelReason)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentTenant() tenant: TenantPayload) {
    return this.service.remove(id, tenant.id)
  }
}
