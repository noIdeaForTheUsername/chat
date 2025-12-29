import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesDomainModule } from 'src/domain/messages/messages.module';
import { ConversationsDomainModule } from 'src/domain/conversations/conversations.module';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService],
  imports: [MessagesDomainModule, ConversationsDomainModule],
})
export class MessagesModule {}
