import { initializeTransactionalContext } from 'typeorm-transactional';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { static as expressStatic } from 'express';
import session from 'express-session';

async function bootstrap() {
  // TypeORM Transactional Context
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, exceptionFactory(errors) {
    throw new BadRequestException(`invalid.${errors[0].property}`);
  }}));

  // Cookies
  app.use(cookieParser());

  // Sessions
  app.use(
    session({
      secret: config.get<string>('auth.secret') as any,
      resave: false,
      saveUninitialized: false,
      name: "session",
      cookie: {
        httpOnly: config.get<boolean>('cookies.httpOnly'),
        sameSite: config.get<string>('cookies.sameSite') as any,
        secure: config.get<boolean>('cookies.secure'),
        maxAge: config.get<number>('cookies.expire_ms'),
      }
    }),
  );

  // admin web interface
  app.use('/admin', expressStatic(join(__dirname, '..', 'admin-interface')));

  // Port
  const port = config.get<number>('app.port') ?? 3000;

  // CORS
  app.enableCors({
    origin: config.get<string[]>('cors.origins'),
    credentials: true,
  });
  await app.listen(port);
}
bootstrap();
