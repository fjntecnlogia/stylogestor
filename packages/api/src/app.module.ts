import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from './modules/auth/auth.module'
import { TenantsModule } from './modules/tenants/tenants.module'
import { AppointmentsModule } from './modules/appointments/appointments.module'
import { ClientsModule } from './modules/clients/clients.module'
import { ProfessionalsModule } from './modules/professionals/professionals.module'
import { FinancialModule } from './modules/financial/financial.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module'
import { PrismaModule } from './common/prisma/prisma.module'

@Module({
  imports: [
    // Config global
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting: 100 req/minuto por IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Prisma (banco)
    PrismaModule,

    // Módulos de negócio
    AuthModule,
    TenantsModule,
    AppointmentsModule,
    ClientsModule,
    ProfessionalsModule,
    FinancialModule,
    NotificationsModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}
