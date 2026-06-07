import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use(helmet());
  app.use(json({ limit: getRequestBodyLimit() }));
  app.use(urlencoded({ extended: true, limit: getRequestBodyLimit() }));

  const globalPrefix = process.env.API_GLOBAL_PREFIX?.trim();

  if (globalPrefix) {
    app.setGlobalPrefix(globalPrefix);
  }

  const allowedOrigins = getAllowedCorsOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(3001);
}
bootstrap();

function getRequestBodyLimit() {
  return process.env.REQUEST_BODY_LIMIT?.trim() || '100kb';
}

function getAllowedCorsOrigins() {
  const configuredOrigins = (
    process.env.CORS_ALLOWED_ORIGINS ??
    'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(configuredOrigins);
}
