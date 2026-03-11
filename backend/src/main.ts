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
import { FcmService } from './application/push-notifications/services/fcm.service';
// import { SessionInBodyInterceptor } from './shared/auth/session-in-body.interceptor';
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
  // app.useGlobalInterceptors(new SessionInBodyInterceptor());
  app.use(sessionMiddleware);

  // STATIC
  app.use('/admin', expressStatic(join(__dirname, '..', 'admin-interface')));  // admin interface
  app.use('/android-download', expressStatic(join(__dirname, '..', 'android-download'), {  // android app .apk
    setHeaders(res) {
      res.setHeader(
        "Content-Type",
        "application/vnd.android.package-archive"
      );
      res.setHeader("Cache-Control", "no-cache");
    }}));

  // FCM notifications
  const fcmService = app.get(FcmService);
  fcmService.initFcm();

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
