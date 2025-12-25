import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtSecret } from './jwt-constants';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    UsersModule,
    JwtModule.register({
      global: false,
      secret: jwtSecret, // TODO: move to env variable
      signOptions: { expiresIn: '1d' },
    }),
  ],
})
export class AuthModule {}
