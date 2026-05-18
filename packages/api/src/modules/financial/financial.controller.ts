import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { FinancialService } from './financial.service'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { TenantThrottleGuard } from '../../common/guards/tenant-throttle.guard'
import { TenantContextInterceptor } from '../../common/interceptors/tenant-context.interceptor'
import { CurrentTenant, TenantPayload } from '../../common/decorators/current-tenant.decorator'

@ApiTags('Financial') @ApiBearerAuth()
@UseGuards(TenantGuard, TenantThrottleGuard) @UseInterceptors(TenantContextInterceptor)
@Controller('financial')
export class FinancialController {
  constructor(private service: FinancialService) {}

  @Get('cashflow') cashflow(@CurrentTenant() t: TenantPayload, @Query('month') month: string) {
    return this.service.getCashflow(t.id, month)
  }

  @Get('transactions') transactions(@CurrentTenant() t: TenantPayload, @Query('from') from: string, @Query('to') to: string) {
    return this.service.getTransactions(t.id, from, to)
  }

  @Get('reports/daily') daily(@CurrentTenant() t: TenantPayload, @Query('date') date: string) {
    return this.service.getDailyReport(t.id, date)
  }

  @Post('transactions') create(@Body() dto: CreateTransactionDto, @CurrentTenant() t: TenantPayload) {
    return this.service.createTransaction(dto, t.id)
  }
}
