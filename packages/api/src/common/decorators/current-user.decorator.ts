import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface AuthUser {
  /** ID interno da tabela `users` */
  id: string
  /** ID do usuário no Clerk (web) — null se cadastrado só via Supabase */
  clerkId: string | null
  /** ID do usuário no Supabase (mobile) — null se cadastrado só via Clerk */
  supabaseId: string | null
  email: string
  name: string
}

/** Extrai o usuário autenticado do request (injetado pelo MultiAuthGuard) */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)
