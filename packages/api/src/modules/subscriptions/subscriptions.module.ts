import { Module } from '@nestjs/common'
import { SubscriptionsController } from './subscriptions.controller'
import { SubscriptionsService } from './subscriptions.service'
import { StripeService } from './stripe.service'

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, StripeService],
  exports: [StripeService],
})
export class SubscriptionsModule {}
