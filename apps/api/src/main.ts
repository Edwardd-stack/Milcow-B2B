import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SocketIoAdapter } from './libs/adapters/socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Production: browser → Vercel (Next proxy) → Render → API. Without this, req.ip is the proxy's IP,
  // so every visitor would share ONE rate limit. Vercel overwrites X-Forwarded-For with the real
  // client IP, and 'trust proxy' makes Express read req.ip from that header.
  if (config.get<string>('NODE_ENV') === 'production') app.set('trust proxy', true);

  // Every route starts with /api/v1  →  GET /api/v1/health
  app.setGlobalPrefix('api/v1');

  // Only our own frontends may call the API (REST and WebSocket) from a browser
  const corsOrigins = config.getOrThrow<string>('CORS_ORIGINS').split(',');
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.useWebSocketAdapter(new SocketIoAdapter(app, corsOrigins));

  // Validates every request body/query against its DTO class
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip fields that are not in the DTO
      forbidNonWhitelisted: true, // ...or reject the request if they are sent
      transform: true, // "10" in a query string → number 10
    }),
  );

  // One error format for the whole API + one log line per request
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger: interactive API documentation at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Milcow API')
    .setDescription('B2B dairy trading platform — REST API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);

  Logger.log(`API:  http://localhost:${port}/api/v1`, 'Bootstrap');
  Logger.log(`Docs: http://localhost:${port}/api/docs`, 'Bootstrap');
}

void bootstrap();
