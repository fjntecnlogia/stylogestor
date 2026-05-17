import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface AuthUser {
  /** ID interno da tabela `users` */
  id: string
  /** ID do usuário no Clerk */
  clerkId: string
  email: string
  name: string
}

/** Extrai o usuário autenticado do request (injetado pelo ClerkAuthGuard) */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)
