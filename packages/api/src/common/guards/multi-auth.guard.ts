import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { verifyToken } from '@clerk/backend'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseAuthService } from '../auth/supabase-auth.service'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

/**
 * Guard de autenticação FEDERADA — aceita JWT do Clerk (web) OU Supabase (mobile).
 *
 * Estratégia de unificação (ver docs/AUTH_UNIFICATION.md):
 *   1. Decodifica o JWT (sem verificar) só pra ler o `iss` e rotear pro provider.
 *   2. Valida no provider certo (Clerk verifyToken / Supabase getUser).
 *   3. Resolve o User interno por providerId; se não achar, faz fallback por
 *      EMAIL e linka o providerId que faltava (mesma pessoa, mesmo email).
 *
 * `email` é a chave de unificação: a mesma pessoa logando via web (Clerk) ou
 * mobile (Supabase) resolve pro mesmo `User` + mesmo tenant.
 *
 * Rotas `@Public()` são ignoradas.
 */
@Injectable()
export class MultiAuthGuard implements CanActivate {
  private readonly logger = new Logger(MultiAuthGuard.name)

  /**
   * Modo de autenticação (env `AUTH_MODE`):
   *  - `federated` (default): aceita Clerk (web) + Supabase (mobile).
   *  - `supabase-only`: rejeita JWT Clerk. Usado no fim da migração (Fase 3/4),
   *    quando o web já autentica no Supabase. Permite o cutover (e o rollback)
   *    por variável de ambiente, sem redeploy de código.
   */
  private readonly authMode: 'federated' | 'supabase-only' =
    process.env.AUTH_MODE === 'supabase-only' ? 'supabase-only' : 'federated'

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseAuthService,
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

    // Roteia pro provider olhando o `iss` (sem verificar — só decode do payload)
    const issuer = this.peekIssuer(token)
    const isSupabase = issuer.includes('supabase') || issuer.includes('/auth/v1')

    // Cutover Fase 3/4: com AUTH_MODE=supabase-only, JWT Clerk é recusado.
    if (this.authMode === 'supabase-only' && !isSupabase) {
      throw new UnauthorizedException(
        'Autenticação via Clerk desativada (AUTH_MODE=supabase-only)',
      )
    }

    const user = isSupabase
      ? await this.resolveSupabase(token)
      : await this.resolveClerk(token)

    request.user = user
    return true
  }

  /** Decodifica o payload do JWT sem verificar assinatura (só pra ler `iss`). */
  private peekIssuer(token: string): string {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return ''
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
      return typeof payload.iss === 'string' ? payload.iss : ''
    } catch {
      return ''
    }
  }

  // ── Clerk (web) ──────────────────────────────────────────────
  private async resolveClerk(token: string) {
    let clerkUserId: string
    let email: string | undefined
    let name: string | undefined
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      })
      if (!payload.sub) throw new Error('JWT sem subject')
      clerkUserId = payload.sub
      email = (payload.email as string | undefined) ?? undefined
      name = (payload.name as string | undefined) ?? undefined
    } catch (err) {
      this.logger.warn(`Clerk JWT inválido: ${err instanceof Error ? err.message : 'erro'}`)
      throw new UnauthorizedException('Token inválido ou expirado')
    }

    // 1. Por clerkId
    let user = await this.prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true, clerkId: true, supabaseId: true, email: true, name: true },
    })
    if (user) return user

    // 2. Fallback por email — linka clerkId a um User que já existe (ex: criado via Supabase)
    if (email) {
      const byEmail = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, clerkId: true, supabaseId: true, email: true, name: true },
      })
      if (byEmail) {
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: { clerkId: clerkUserId },
          select: { id: true, clerkId: true, supabaseId: true, email: true, name: true },
        })
        this.logger.log(`Clerk linkado a User existente por email: ${email}`)
        return user
      }
    }

    // 3. Não existe — webhook do Clerk ainda não rodou (ou email ausente no JWT)
    throw new UnauthorizedException(
      'Usuário ainda não sincronizado. Tente novamente em alguns segundos.',
    )
  }

  // ── Supabase (mobile) ────────────────────────────────────────
  private async resolveSupabase(token: string) {
    const info = await this.supabase.verify(token)
    if (!info) {
      throw new UnauthorizedException('Token inválido ou expirado')
    }

    // 1. Por supabaseId
    let user = await this.prisma.user.findUnique({
      where: { supabaseId: info.supabaseId },
      select: { id: true, clerkId: true, supabaseId: true, email: true, name: true },
    })
    if (user) return user

    // 2. Fallback por email — linka supabaseId a User existente (ex: criado via Clerk/web)
    const byEmail = await this.prisma.user.findUnique({
      where: { email: info.email },
      select: { id: true, clerkId: true, supabaseId: true, email: true, name: true },
    })
    if (byEmail) {
      user = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: { supabaseId: info.supabaseId },
        select: { id: true, clerkId: true, supabaseId: true, email: true, name: true },
      })
      this.logger.log(`Supabase linkado a User existente por email: ${info.email}`)
      return user
    }

    // 3. Não existe em lugar nenhum — cria User novo (mobile-first signup).
    //    Sem tenant ainda: TenantGuard vai barrar rotas que exigem tenant até
    //    o user ser vinculado a um (onboarding).
    user = await this.prisma.user.create({
      data: {
        supabaseId: info.supabaseId,
        email: info.email,
        name: info.name || info.email,
      },
      select: { id: true, clerkId: true, supabaseId: true, email: true, name: true },
    })
    this.logger.log(`Novo User criado via Supabase: ${info.email}`)
    return user
  }
}
