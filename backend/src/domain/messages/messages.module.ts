import { Module } from '@nestjs/common';
import { MessagesDomainService } from './messages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { LatestUserMessage } from './entities/latest-user-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, LatestUserMessage])],
  providers: [MessagesDomainService],
  exports: [MessagesDomainService],
})
export class MessagesDomainModule {}
