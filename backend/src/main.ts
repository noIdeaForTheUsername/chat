import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { static as expressStatic } from 'express';
import { join } from 'path';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module';
import { FcmService } from './application/push-notifications/services/fcm.service';
import { initSessionMiddleware } from './application/users/sessions/session.middleware';
import { LoggingService } from './shared/logging/app-logger';


async function bootstrap() {
  // TypeORM Transactional Context
  initializeTransactionalContext();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);
  if (config.get('app.trustProxy'))
    app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.useLogger(app.get(LoggingService));

  // Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, exceptionFactory(errors) {
    throw new BadRequestException(`invalid.${errors[0].property}`);
  }}));

  // Cookies
  app.use(cookieParser());

  // Sessions
  const sessionMiddleware = await initSessionMiddleware(config);
  app.use(sessionMiddleware);

  // Security headers - TODO: MOVE TO NGINX
  // const securityHeadersMiddleware = app.get(SecurityHeadersMiddleware);
  // app.use(securityHeadersMiddleware);

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

  // CORS
  app.enableCors({
    origin: config.get<string[]>('allowedOrigins'),
    credentials: true,
  });

  // Port
  const port = config.get<number>('app.port') ?? 3000;
  await app.listen(port);
}
bootstrap();
