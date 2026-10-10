
import { NestFactory } from '@nestjs/core';
import {
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Load local .env when available.
  // Production hosting should inject environment variables.
  try {
    process.loadEnvFile();
  } catch {
    // Ignore if .env does not exist.
  }

  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    methods: [
      'GET',
      'HEAD',
      'PUT',
      'PATCH',
      'POST',
      'DELETE',
      'OPTIONS',
    ],
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global response transformation
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Question Generator API')
    .setDescription(
      'REST API for generating educational MCQ and Creative Questions using Google Gemini.',
    )
    .setVersion('1.0.0')
    .addTag('Documents', 'Upload and manage educational documents')
    .addTag(
      'Questions Management',
      'Generate, retrieve, edit, and export questions',
    )
    .addTag(
      'AI Question Generation',
      'AI-powered question generation endpoints',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  });

  // Start server
  const port = Number(process.env.PORT) || 3000;

  await app.listen(port, '0.0.0.0');

  logger.log(`Backend started on port ${port}`);
  logger.log(`Swagger docs: /api/docs`);
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start the application', error);
  process.exit(1);
});
