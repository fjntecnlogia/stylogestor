import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Seta o tenant_id na sessão do PostgreSQL antes de cada query.
 * O RLS usa current_setting('app.tenant_id') para filtrar automaticamente.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest()
    const tenant = request.tenant

    if (tenant?.id) {
      // false = configuração de sessão (não de transação) — compatível com pool de conexões
      await this.prisma.$executeRawUnsafe(
        `SELECT set_config('app.tenant_id', $1, false)`,
        tenant.id
      )
    }

    return next.handle()
  }
}
