import { initializeTransactionalContext } from 'typeorm-transactional';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { static as expressStatic } from 'express';

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create(AppModule);
  // cookies
  app.use(cookieParser());
  // Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, exceptionFactory(errors) {
    throw new BadRequestException(`invalid.${errors[0].property}`);
  }}));

  // admin web interface
  app.use('/admin', expressStatic(join(__dirname, '..', 'admin-interface')));

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3000;

  // CORS
  app.enableCors({
    origin: config.get<string[]>('cors.origins'),
    credentials: true,
  });
  await app.listen(port);
}
bootstrap();
