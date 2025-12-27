import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AccountsController } from './accounts.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtSecret } from '../jwt-constants';
import { APP_GUARD } from '@nestjs/core';
import { LoggedInGuard } from './logged-in.guard';

@Module({
  controllers: [AccountsController],
  imports: [
    TypeOrmModule.forFeature([Account]),
    JwtModule.register({
      global: true,
      secret: jwtSecret, // TODO: move to env variable
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [
    AccountsService,
    {
      provide: APP_GUARD,
      useClass: LoggedInGuard,
    }
  ],
  exports: [AccountsService],
})
export class AccountsModule {}
