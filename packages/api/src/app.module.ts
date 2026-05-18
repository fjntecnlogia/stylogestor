import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup'
import { AuthModule } from './modules/auth/auth.module'
import { HealthModule } from './modules/health/health.module'
import { TenantsModule } from './modules/tenants/tenants.module'
import { AppointmentsModule } from './modules/appointments/appointments.module'
import { ClientsModule } from './modules/clients/clients.module'
import { ProfessionalsModule } from './modules/professionals/professionals.module'
import { FinancialModule } from './modules/financial/financial.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module'
import { ClerkModule } from './common/clerk/clerk.module'
import { PrismaModule } from './common/prisma/prisma.module'
import { ClerkAuthGuard } from './common/guards/clerk-auth.guard'

@Module({
  imports: [
    // Config global
    ConfigModule.forRoot({ isGlobal: true }),

    // Sentry — captura exceptions automaticamente em todos os modules
    SentryModule.forRoot(),

    // Rate limiting: 100 req/minuto por IP (precisa do APP_GUARD abaixo para funcionar)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Prisma (banco)
    PrismaModule,

    // Clerk Backend (atualiza publicMetadata pra middleware Next ler)
    ClerkModule,

    // Health check (monitoria externa) — primeiro pra registrar rota antes dos outros
    HealthModule,

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
    // 3. Sentry global exception filter — captura erros não-handled antes do
    //    NestJS reportar 500. Precisa ser o PRIMEIRO filter (APP_FILTER ordem
    //    reversa, então o último na lista é o primeiro a rodar).
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
  ],
})
export class AppModule {}
