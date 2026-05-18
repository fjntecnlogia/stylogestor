import { Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module'
import { SubscriptionsController } from './subscriptions.controller'
import { SubscriptionsService } from './subscriptions.service'
import { StripeService } from './stripe.service'

@Module({
  imports: [NotificationsModule], // Pra EmailService
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, StripeService],
  exports: [StripeService],
})
export class SubscriptionsModule {}
