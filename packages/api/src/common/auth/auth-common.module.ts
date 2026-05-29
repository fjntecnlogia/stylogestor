import { Global, Module } from '@nestjs/common'
import { SupabaseAuthService } from './supabase-auth.service'
import { SupabaseMetadataService } from './supabase-metadata.service'

/**
 * Módulo de auth comum (federada). Provê:
 *  - SupabaseAuthService — validação de JWT (usado pelo MultiAuthGuard);
 *  - SupabaseMetadataService — escrita de app_metadata (role/assinatura/tenant)
 *    usado por tenants (onboarding) e subscriptions (webhook Stripe).
 * Global pra ficar disponível no APP_GUARD e nos módulos de negócio.
 */
@Global()
@Module({
  providers: [SupabaseAuthService, SupabaseMetadataService],
  exports: [SupabaseAuthService, SupabaseMetadataService],
})
export class AuthCommonModule {}
