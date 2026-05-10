import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

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
  console.log(`🚀 STYLOGESTOR API rodando em: http://localhost:${port}`)
  console.log(`📚 Documentação: http://localhost:${port}/docs`)
}

bootstrap()
