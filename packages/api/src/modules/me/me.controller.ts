import { Controller, Patch, Post, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { MeService } from './me.service'
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator'

/**
 * Rotas user-scoped (`/me/*`). Auth pelo MultiAuthGuard global (sem TenantGuard).
 */
@ApiTags('Me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Patch('tour-completed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marca app_metadata.tourCompleted = true' })
  tourCompleted(@CurrentUser() user: AuthUser) {
    return this.meService.markTourCompleted(user.supabaseId)
  }

  @Post('reset-onboarding')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desvincula tenants do usuário + limpa claims do app_metadata' })
  resetOnboarding(@CurrentUser() user: AuthUser) {
    return this.meService.resetOnboarding(user.id, user.supabaseId)
  }
}
