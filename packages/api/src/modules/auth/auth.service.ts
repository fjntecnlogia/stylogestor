import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

interface ClerkEmailAddress {
  email_address: string
}

interface ClerkUserData {
  id: string
  email_addresses?: ClerkEmailAddress[]
  first_name?: string | null
  last_name?: string | null
  image_url?: string | null
}

interface ClerkEvent {
  type: string
  data: ClerkUserData
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * Processa um evento do Clerk de forma idempotente.
   * O webhook controller já validou a assinatura svix e o eventId
   * (provider+eventId é UNIQUE em webhook_events).
   */
  async handleClerkEvent(event: ClerkEvent): Promise<void> {
    const { type, data } = event

    if (type === 'user.created' || type === 'user.updated') {
      const email = data.email_addresses?.[0]?.email_address
      if (!email || !data.id) {
        this.logger.warn(`Evento ${type} sem email ou id`)
        return
      }

      const name =
        `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || email

      await this.prisma.user.upsert({
        where: { clerkId: data.id },
        create: {
          clerkId: data.id,
          email,
          name,
          avatar: data.image_url ?? undefined,
        },
        update: {
          email,
          name,
          avatar: data.image_url ?? undefined,
        },
      })

      this.logger.log(`Usuário ${type === 'user.created' ? 'criado' : 'atualizado'}: clerkId=${data.id}`)
      return
    }

    if (type === 'user.deleted') {
      if (!data.id) return
      // Soft-delete: mantém o registro, mas membership será negada pelo TenantGuard
      // se quisermos cascatear, fazer deleteMany aqui. Por ora apenas log.
      this.logger.log(`user.deleted recebido: clerkId=${data.id} (sem ação)`)
      return
    }

    this.logger.log(`Evento Clerk não tratado: ${type}`)
  }
}
