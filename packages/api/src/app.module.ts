import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { AuthModule } from './modules/auth/auth.module'
import { TenantsModule } from './modules/tenants/tenants.module'
import { AppointmentsModule } from './modules/appointments/appointments.module'
import { ClientsModule } from './modules/clients/clients.module'
import { ProfessionalsModule } from './modules/professionals/professionals.module'
import { FinancialModule } from './modules/financial/financial.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module'
import { PrismaModule } from './common/prisma/prisma.module'
import { ClerkAuthGuard } from './common/guards/clerk-auth.guard'

@Module({
  imports: [
    // Config global
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting: 100 req/minuto por IP (precisa do APP_GUARD abaixo para funcionar)
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
  providers: [
    // 1. Rate limit em TODAS as rotas (rotas @Public também — protege webhooks de abuso)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // 2. Auth Clerk em TODAS as rotas exceto @Public()
    { provide: APP_GUARD, useClass: ClerkAuthGuard },
  ],
})
export class AppModule {}
