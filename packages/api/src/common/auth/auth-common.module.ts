import { Global, Module } from '@nestjs/common'
import { SupabaseAuthService } from './supabase-auth.service'

/**
 * Módulo de auth comum (federada). Provê o SupabaseAuthService usado pelo
 * MultiAuthGuard. Global pra ficar disponível no APP_GUARD.
 */
@Global()
@Module({
  providers: [SupabaseAuthService],
  exports: [SupabaseAuthService],
})
export class AuthCommonModule {}
