// ⚠️ Sentry instrument DEVE ser o primeiro import — instrumenta Node antes de
// qualquer outro pacote ser carregado. Sem isso, traces ficam incompletos.
import './instrument'

import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  // rawBody: true → preserva o corpo bruto para validação HMAC de webhooks
  // (svix do Clerk e Stripe.webhooks.constructEvent precisam disso)
  const app = await NestFactory.create(AppModule, { rawBody: true })

  // Segurança
  app.use(helmet())

  // CORS — permite os domínios do STYLOGESTOR
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      /\.stylogestor\.com\.br$/,
    ],
    credentials: true,
  })

  // Validação global dos DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Remove campos não declarados no DTO
      forbidNonWhitelisted: true,
      transform: true,        // Transforma tipos automaticamente
      transformOptions: { enableImplicitConversion: true },
    })
  )

  // Prefixo global da API
  app.setGlobalPrefix('api/v1')

  // Swagger (documentação)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('STYLOGESTOR API')
      .setDescription('API do sistema de gestão para barbearias e salões')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('docs', app, document)
  }

  const port = process.env.PORT || 3001
  await app.listen(port)
  logger.log(`🚀 STYLOGESTOR API rodando em: http://localhost:${port}`)
  logger.log(`📚 Documentação: http://localhost:${port}/docs`)
}

bootstrap()
