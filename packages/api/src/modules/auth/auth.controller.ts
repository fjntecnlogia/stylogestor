import { Controller, Post, Headers, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../../common/prisma/prisma.service'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  /** Webhook do Clerk — sincroniza usuário no banco */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async clerkWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const { type, data } = payload as { type: string; data: Record<string, unknown> }

    if (type === 'user.created' || type === 'user.updated') {
      const emailAddresses = data.email_addresses as Array<{ email_address: string }>
      const email = emailAddresses?.[0]?.email_address
      const firstName = data.first_name as string
      const lastName = data.last_name as string

      await this.prisma.user.upsert({
        where: { clerkId: data.id as string },
        create: {
          clerkId: data.id as string,
          email,
          name: `${firstName ?? ''} ${lastName ?? ''}`.trim() || email,
          avatar: data.image_url as string,
        },
        update: {
          email,
          name: `${firstName ?? ''} ${lastName ?? ''}`.trim() || email,
          avatar: data.image_url as string,
        },
      })
    }

    return { received: true }
  }
}
