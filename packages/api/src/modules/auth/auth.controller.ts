import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
  RawBodyRequest,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { Webhook } from 'svix'
import { AuthService } from './auth.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { Public } from '../../common/decorators/public.decorator'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Webhook do Clerk — sincroniza usuário no banco.
   *
   * Pipeline:
   * 1. @Public (sem ClerkAuthGuard) + valida assinatura svix.
   * 2. Checa idempotência (webhook_events.provider+eventId UNIQUE).
   * 3. Processa via AuthService.
   * 4. Registra evento como processado (em transação com o processamento? — não, porque
   *    queremos que se o handler falhar, NÃO marquemos como processado e o Clerk re-tente).
   *    Estratégia: processa primeiro, marca depois. Em caso de re-entrega, o handler é
   *    idempotente (upsert), então é seguro.
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async clerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const secret = process.env.CLERK_WEBHOOK_SECRET
    if (!secret) {
      this.logger.error('CLERK_WEBHOOK_SECRET não configurado')
      throw new InternalServerErrorException('Webhook não configurado')
    }

    const rawBody = req.rawBody
    if (!rawBody || !svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Headers svix ou body ausentes')
    }

    // 1. Valida assinatura svix — lança em caso de falha
    let event: { type: string; data: Record<string, unknown> }
    try {
      const wh = new Webhook(secret)
      event = wh.verify(rawBody.toString('utf8'), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data: Record<string, unknown> }
    } catch (err) {
      this.logger.warn(`Assinatura svix inválida: ${err instanceof Error ? err.message : 'erro'}`)
      throw new BadRequestException('Assinatura inválida')
    }

    // 2. Idempotência por svix-id
    const alreadyProcessed = await this.prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider: 'clerk', eventId: svixId } },
      select: { id: true },
    })
    if (alreadyProcessed) {
      this.logger.log(`Evento Clerk duplicado ignorado: ${svixId}`)
      return { received: true, duplicate: true }
    }

    // 3. Processa (pode lançar — Clerk re-tenta em 5xx)
    await this.authService.handleClerkEvent({
      type: event.type,
      data: event.data as never,
    })

    // 4. Marca como processado
    await this.prisma.webhookEvent.create({
      data: {
        provider: 'clerk',
        eventId: svixId,
        eventType: event.type,
      },
    })

    return { received: true }
  }
}
