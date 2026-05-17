import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { createClerkClient, verifyToken } from '@clerk/backend'
import { PrismaService } from '../prisma/prisma.service'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

/**
 * Valida o JWT do Clerk no header `Authorization: Bearer <token>` e
 * injeta o usuário interno (tabela `users`) em `request.user`.
 *
 * Rotas marcadas com `@Public()` são ignoradas.
 *
 * Pré-requisito: o usuário precisa existir na tabela `users` — o webhook
 * `auth/webhook` (Clerk) faz o `upsert` automaticamente em user.created/updated.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name)
  private readonly clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  })

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const authHeader: string | undefined = request.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticação ausente')
    }
    const token = authHeader.slice('Bearer '.length).trim()

    let clerkUserId: string
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      })
      // `sub` no JWT do Clerk é o user.id (clerkId)
      if (!payload.sub) throw new Error('JWT sem subject')
      clerkUserId = payload.sub
    } catch (err) {
      this.logger.warn(`JWT inválido: ${err instanceof Error ? err.message : 'erro'}`)
      throw new UnauthorizedException('Token inválido ou expirado')
    }

    // Carrega o usuário interno pelo clerkId
    const user = await this.prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true, clerkId: true, email: true, name: true },
    })

    if (!user) {
      // Pode acontecer se o webhook do Clerk ainda não rodou — pedir retry
      throw new UnauthorizedException(
        'Usuário ainda não sincronizado. Tente novamente em alguns segundos.',
      )
    }

    request.user = user
    return true
  }
}
