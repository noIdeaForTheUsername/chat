import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesDomainModule } from 'src/domain/messages/messages.module';
import { ConversationsDomainModule } from 'src/domain/conversations/conversations.module';
import { MessagesGateway } from './messages.gateway';
import { AccountsDomainModule } from 'src/domain/accounts/accounts.module';
import { NotBlockingParticipantsModule } from '../shared/not-blocking-participants/not-blocking-participants.module';
import { MessageBroadcastingService } from './message-broadcasting.service';
import { ProfilesDomainModule } from 'src/domain/profiles/profiles.module';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway, MessageBroadcastingService],
  imports: [MessagesDomainModule, ConversationsDomainModule, AccountsDomainModule, ProfilesDomainModule, NotBlockingParticipantsModule],
})
export class MessagesModule {}
