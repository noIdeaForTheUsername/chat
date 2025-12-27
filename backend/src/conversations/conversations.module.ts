import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Participation } from './entities/participation.entity';
import { UserConversation } from './entities/user-conversation.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Conversation, Participation, UserConversation])
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
