import { initializeTransactionalContext } from 'typeorm-transactional';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create(AppModule);
  // cookies
  app.use(cookieParser());
  // Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, exceptionFactory(errors) {
    throw new BadRequestException(`invalid.${errors[0].property}`);
  }}));
  // CORS
  app.enableCors({
    origin: ["http://localhost:8100", "http://192.168.1.2:8100", "http://chmuraim.dynv6.net:8100", "http://46.205.222.219:8100"],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 2137);
}
bootstrap();
