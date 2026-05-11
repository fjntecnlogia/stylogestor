import {
  Controller, Get, Post, Body, Req, Headers,
  UseGuards, RawBodyRequest, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { SubscriptionsService } from './subscriptions.service'
import { StripeService } from './stripe.service'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { CurrentTenant, TenantPayload } from '../../common/decorators/current-tenant.decorator'

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly service: SubscriptionsService,
    private readonly stripe: StripeService,
  ) {}

  /** Listar planos disponíveis */
  @Get('plans')
  getPlans() {
    return this.service.getPlans()
  }

  /** Assinatura atual do tenant */
  @UseGuards(TenantGuard)
  @Get('current')
  getCurrent(@CurrentTenant() t: TenantPayload) {
    return this.service.getCurrent(t.id)
  }

  /** Criar sessão de checkout no Stripe */
  @UseGuards(TenantGuard)
  @Post('checkout')
  async createCheckout(
    @CurrentTenant() t: TenantPayload,
    @Body() body: { plan: 'STARTER' | 'PRO' | 'PREMIUM'; ciclo: 'mensal' | 'anual'; email: string },
  ) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return this.stripe.createCheckoutSession({
      tenantId: t.id,
      tenantName: t.name,
      email: body.email,
      plan: body.plan,
      ciclo: body.ciclo,
      successUrl: `${appUrl}/planos?success=true&plan=${body.plan}`,
      cancelUrl: `${appUrl}/planos?canceled=true`,
    })
  }

  /** Portal do cliente Stripe (gerenciar cartão, cancelar) */
  @UseGuards(TenantGuard)
  @Post('portal')
  async createPortal(@CurrentTenant() t: TenantPayload) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const sub = await this.service.getCurrent(t.id)

    if (!sub?.stripeCustomerId) {
      return { error: 'Nenhuma assinatura ativa encontrada' }
    }

    return this.stripe.createBillingPortalSession(
      sub.stripeCustomerId,
      `${appUrl}/planos`,
    )
  }

  /** Webhook do Stripe — recebe eventos de pagamento */
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody

    if (!payload || !signature) {
      return { received: false }
    }

    try {
      const event = this.stripe.constructWebhookEvent(payload, signature)
      await this.service.handleStripeEvent(event)
      return { received: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      return { received: false, error: msg }
    }
  }
}
