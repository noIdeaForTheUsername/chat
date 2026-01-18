import { initializeTransactionalContext } from 'typeorm-transactional';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { BadRequestException, NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { static as expressStatic } from 'express';
import { initSessionMiddleware } from './shared/auth/session.middleware';
import { NestExpressApplication } from '@nestjs/platform-express';
// import { SocketIoAdapter } from './shared/websockets/socket-io.adapter';

async function bootstrap() {
  // TypeORM Transactional Context
  initializeTransactionalContext();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, exceptionFactory(errors) {
    throw new BadRequestException(`invalid.${errors[0].property}`);
  }}));

  // Cookies
  app.use(cookieParser());

  // Sessions
  const sessionMiddleware = await initSessionMiddleware(config);
  app.use(sessionMiddleware);

  // admin web interface
  app.use('/admin', expressStatic(join(__dirname, '..', 'admin-interface')));

  // Port
  const port = config.get<number>('app.port') ?? 3000;

  // CORS
  app.enableCors({
    origin: config.get<string[]>('cors.origins'),
    credentials: true,
  });
  // app.useWebSocketAdapter(new SocketIoAdapter(config));
  await app.listen(port);
}
bootstrap();
