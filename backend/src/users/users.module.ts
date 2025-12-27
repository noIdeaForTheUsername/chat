import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './accounts/entities/account.entity';
import { Profile } from './profiles/entities/profile.entity';
import { AuthService } from './auth.service';
import { ProfilesModule } from './profiles/profiles.module';
import { AccountsModule } from './accounts/accounts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Profile]), ProfilesModule, AccountsModule],
  controllers: [UsersController],
  providers: [UsersService, AuthService],
  exports: [UsersService],
})
export class UsersModule {}
