import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccountsModule } from 'src/accounts/accounts.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtSecret } from './jwt-constants';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
  ],
  imports: [
    AccountsModule,
    JwtModule.register({
      global: true,
      secret: jwtSecret, // TODO: move to env variable
      signOptions: { expiresIn: '1d' },
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
