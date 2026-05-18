import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { SubscriptionsService } from './subscriptions.service'
import { StripeService } from './stripe.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { TenantThrottleGuard } from '../../common/guards/tenant-throttle.guard'
import { Public } from '../../common/decorators/public.decorator'
import {
  CurrentTenant,
  TenantPayload,
} from '../../common/decorators/current-tenant.decorator'

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name)

  constructor(
    private readonly service: SubscriptionsService,
    private readonly stripe: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  /** Listar planos disponíveis (público — usado na landing/site) */
  @Public()
  @Get('plans')
  getPlans() {
    return this.service.getPlans()
  }

  /** Assinatura atual do tenant */
  @ApiBearerAuth()
  @UseGuards(TenantGuard, TenantThrottleGuard)
  @Get('current')
  getCurrent(@CurrentTenant() t: TenantPayload) {
    return this.service.getCurrent(t.id)
  }

  /** Criar sessão de checkout no Stripe */
  @ApiBearerAuth()
  @UseGuards(TenantGuard, TenantThrottleGuard)
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
  @ApiBearerAuth()
  @UseGuards(TenantGuard, TenantThrottleGuard)
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

  /**
   * Webhook do Stripe.
   *
   * Pipeline:
   * 1. @Public (sem ClerkAuthGuard).
   * 2. Valida assinatura HMAC com `constructEvent` (rawBody).
   *    Falha → 400 (Stripe não re-tenta — assinatura inválida nunca vai melhorar).
   * 3. Idempotência por `event.id`.
   * 4. Processa via service.
   *    Falha → re-lança (Nest devolve 500, Stripe re-tenta).
   * 5. Marca como processado.
   */
  @Public()
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody
    if (!payload || !signature) {
      throw new BadRequestException('Body bruto ou assinatura ausente')
    }

    // 2. Valida assinatura — falha de assinatura é 400 (não re-tentar)
    let event
    try {
      event = this.stripe.constructWebhookEvent(payload, signature)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'erro desconhecido'
      this.logger.warn(`Assinatura Stripe inválida: ${msg}`)
      throw new BadRequestException('Assinatura inválida')
    }

    // 3. Idempotência por event.id
    const duplicate = await this.prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider: 'stripe', eventId: event.id } },
      select: { id: true },
    })
    if (duplicate) {
      this.logger.log(`Evento Stripe duplicado ignorado: ${event.id}`)
      return { received: true, duplicate: true }
    }

    // 4. Processa (se lançar, Nest devolve 500 → Stripe re-tenta)
    try {
      await this.service.handleStripeEvent(event)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'erro desconhecido'
      this.logger.error(
        `Falha processando Stripe event ${event.id} (${event.type}): ${msg}`,
      )
      throw new InternalServerErrorException('Falha ao processar evento')
    }

    // 5. Marca como processado
    await this.prisma.webhookEvent.create({
      data: {
        provider: 'stripe',
        eventId: event.id,
        eventType: event.type,
      },
    })

    return { received: true }
  }
}
