import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { SubscriptionsService } from './subscriptions.service'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { CurrentTenant, TenantPayload } from '../../common/decorators/current-tenant.decorator'

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private service: SubscriptionsService) {}

  @Get('plans') getPlans() { return this.service.getPlans() }

  @UseGuards(TenantGuard)
  @Get('current') getCurrent(@CurrentTenant() t: TenantPayload) { return this.service.getCurrent(t.id) }

  @Post('webhooks/pagarme') pagarmeWebhook(@Body() payload: Record<string, unknown>) {
    return this.service.handlePagarmeWebhook(payload)
  }
}
