import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Participation } from './entities/participation.entity';
import { UserConversation } from './entities/user-conversation.entity';
import { ConversationsDomainService } from './conversations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Participation, UserConversation])],
  providers: [ConversationsDomainService],
  exports: [ConversationsDomainService],
})
export class ConversationsDomainModule {}
