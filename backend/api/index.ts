import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

let server: any;

async function bootstrap() {
  let AppModule: any;
  let AllExceptionsFilter: any;
  let TransformInterceptor: any;

  try {
    const appMod = await import('../dist/app.module.js');
    AppModule = appMod.AppModule;
    AllExceptionsFilter = (await import('../dist/common/filters/all-exceptions.filter.js')).AllExceptionsFilter;
    TransformInterceptor = (await import('../dist/common/interceptors/transform.interceptor.js')).TransformInterceptor;
  } catch {
    const appMod = await import('../src/app.module.js');
    AppModule = appMod.AppModule;
    AllExceptionsFilter = (await import('../src/common/filters/all-exceptions.filter.js')).AllExceptionsFilter;
    TransformInterceptor = (await import('../src/common/interceptors/transform.interceptor.js')).TransformInterceptor;
  }

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (AllExceptionsFilter) {
    app.useGlobalFilters(new AllExceptionsFilter());
  }
  if (TransformInterceptor) {
    app.useGlobalInterceptors(new TransformInterceptor());
  }

  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: any, res: any) {
  try {
    // If request URL was rewritten by Vercel to /api, restore the original path if available
    const originalPath = req.headers['x-matched-path'] || req.headers['x-invoke-path'];
    if (originalPath && originalPath !== '/api' && originalPath !== '/api/index') {
      req.url = originalPath;
    }

    if (!server) {
      server = await bootstrap();
    }
    return server(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Invocation Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        statusCode: 500,
        message: 'Internal serverless function initialization error',
        error: err?.message || String(err),
        stack: err?.stack || undefined,
      }),
    );
  }
}
