import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Every route starts with /api/v1  →  GET /api/v1/health
  app.setGlobalPrefix('api/v1');

  // Only our own frontends may call the API from a browser
  app.enableCors({
    origin: config.getOrThrow<string>('CORS_ORIGINS').split(','),
    credentials: true,
  });

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
