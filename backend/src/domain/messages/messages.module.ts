import { Module } from '@nestjs/common';
import { MessagesDomainService } from './messages.service';

@Module({
  providers: [MessagesDomainService],
  exports: [MessagesDomainService],
})
export class MessagesDomainModule {}
