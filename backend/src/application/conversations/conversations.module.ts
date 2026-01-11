import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsDomainModule } from 'src/domain/conversations/conversations.module';
import { ProfilesDomainModule } from 'src/domain/profiles/profiles.module';
import { ContactsDomainModule } from 'src/domain/contacts/contacts.module';
import { MessagesDomainModule } from 'src/domain/messages/messages.module';
import { AccountsDomainModule } from 'src/domain/accounts/accounts.module';

@Module({
  imports: [ConversationsDomainModule, ProfilesDomainModule, ContactsDomainModule, MessagesDomainModule, AccountsDomainModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
