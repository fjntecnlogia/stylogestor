import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Resolve o tenant da requisição e VALIDA que o usuário autenticado é membro.
 *
 * Ordem:
 * 1. Requer `request.user` (ClerkAuthGuard já rodou). Se não, 401.
 * 2. Lê o slug do header `x-tenant-slug` (legacy `x-stylo-tenant`).
 * 3. Carrega o tenant ativo pelo slug.
 * 4. Confirma que existe TenantUser ativo (userId × tenantId) — se não, 403.
 * 5. Injeta `request.tenant` para uso nos controllers.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // 1. Precisa ter passado pelo ClerkAuthGuard
    const user = request.user
    if (!user?.id) {
      throw new UnauthorizedException('Usuário não autenticado')
    }

    // 2. Slug do tenant via header (subdomínio é resolvido no middleware Next.js)
    const tenantSlug =
      request.headers['x-tenant-slug'] ||
      request.headers['x-stylo-tenant']

    if (!tenantSlug) {
      throw new ForbiddenException('Tenant não identificado')
    }

    // 3. Tenant ativo pelo slug
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug, active: true },
      select: { id: true, slug: true, plan: true, name: true },
    })

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantSlug}' não encontrado`)
    }

    // 4. Membership: usuário precisa ter vínculo ativo com este tenant
    const membership = await this.prisma.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      select: { id: true, role: true, active: true },
    })

    if (!membership || !membership.active) {
      throw new ForbiddenException('Usuário não pertence a este tenant')
    }

    // 5. Injeta no request
    request.tenant = tenant
    request.membership = { role: membership.role }

    return true
  }
}
