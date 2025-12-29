import { Module } from '@nestjs/common';
import { MessagesDomainService } from './messages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { UserMessage } from './entities/user-message.entity';
import { LatestUserMessage } from './entities/latest-user-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, UserMessage, LatestUserMessage])],
  providers: [MessagesDomainService],
  exports: [MessagesDomainService],
})
export class MessagesDomainModule {}
