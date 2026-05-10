import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Tenant pode vir do header (interno) ou do subdomínio (via middleware Next.js)
    const tenantSlug =
      request.headers['x-tenant-slug'] ||
      request.headers['x-stylo-tenant']

    if (!tenantSlug) {
      throw new ForbiddenException('Tenant não identificado')
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug, active: true },
      select: { id: true, slug: true, plan: true, name: true },
    })

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantSlug}' não encontrado`)
    }

    // Injeta tenant no request para uso nos controllers
    request.tenant = tenant

    return true
  }
}
