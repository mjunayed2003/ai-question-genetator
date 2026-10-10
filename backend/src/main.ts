import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

// Load .env natively
process.loadEnvFile();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI assets
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Global Input Validation Pipe
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

  // 4. Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 5. Global Response Transform Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // 6. OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Question Generator API')
    .setDescription(
      'Production-grade RESTful API for generating educational Multiple Choice (MCQ) ' +
      'and Creative (CQ) questions from uploaded documents (PDF, images) or topics using Google Gemini.',
    )
    .setVersion('1.0.0')
    .addTag('Documents', 'Upload, parse, and manage educational PDFs and images')
    .addTag('Questions Management', 'Generate, retrieve, edit, regenerate, and export question sets')
    .addTag('AI Question Generation', 'Direct standalone AI question generation endpoints')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app as any, swaggerConfig);
  SwaggerModule.setup('api/docs', app as any, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`====================================================`);
  logger.log(`🚀 AI Question Generator Backend successfully started!`);
  logger.log(`📍 Base API URL:      http://localhost:${port}`);
  logger.log(`📖 Swagger API Docs:  http://localhost:${port}/api/docs`);
  logger.log(`====================================================`);
}

await bootstrap();
