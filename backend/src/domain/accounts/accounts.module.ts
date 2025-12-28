import { Module } from '@nestjs/common';
import { AccountsDomainService } from './accounts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  providers: [AccountsDomainService],
  exports: [AccountsDomainService],
})
export class AccountsDomainModule {}
