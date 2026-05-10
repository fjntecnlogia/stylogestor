import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface TenantPayload {
  id: string
  slug: string
  name: string
  plan: string
}

/** Extrai o tenant do request (injetado pelo TenantGuard) */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantPayload => {
    const request = ctx.switchToHttp().getRequest()
    return request.tenant
  }
)
