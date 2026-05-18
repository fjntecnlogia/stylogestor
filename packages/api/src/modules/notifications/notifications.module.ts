import { Module } from '@nestjs/common'
import { EmailService } from './email.service'
import { NotificationsService } from './notifications.service'

@Module({
  providers: [NotificationsService, EmailService],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
