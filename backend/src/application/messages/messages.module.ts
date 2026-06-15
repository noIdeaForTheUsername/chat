import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesDomainModule } from 'src/domain/messages/messages.module';
import { ConversationsDomainModule } from 'src/domain/conversations/conversations.module';
import { MessagesGateway } from './messages.gateway';
import { AccountsDomainModule } from 'src/domain/accounts/accounts.module';
import { NotBlockingParticipantsModule } from '../shared/not-blocking-participants/not-blocking-participants.module';
import { MessagesDeliveryService } from './messages-delivery.service';
import { ProfilesDomainModule } from 'src/domain/profiles/profiles.module';
import { WsThrottlerGuard } from 'src/shared/global-rate-limiting/ws-throttler.guard';
import { ActionsThrottlerModule } from '../shared/actions-rate-limiting/actions-throttler.module';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway, MessagesDeliveryService, WsThrottlerGuard],
  imports: [MessagesDomainModule, ConversationsDomainModule, AccountsDomainModule, ProfilesDomainModule, NotBlockingParticipantsModule, ActionsThrottlerModule],
})
export class MessagesModule {}
