import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Conversation } from './domain/conversations/entities/conversation.entity';
import { Participation } from './domain/conversations/entities/participation.entity';
import { UserConversation } from './domain/conversations/entities/user-conversation.entity';
import { Account } from './domain/accounts/entities/account.entity';
import { APP_GUARD } from '@nestjs/core';
import { LoggedInGuard } from './shared/auth/logged-in.guard';
import { UserContact } from './domain/profiles/entities/user-contact.entity';
import { Profile } from './domain/profiles/entities/profile.entity';
import { FullProfile } from './domain/profiles/entities/full-profile.entity';
import { Contact } from './domain/profiles/entities/contact.entity';
import { ConversationsModule } from './application/conversations/conversations.module';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { AccountsModule } from './application/users/accounts/accounts.module';
import { AuthModule } from './application/users/auth/auth.module';
import { ProfilesModule } from './application/users/profiles/profiles.module';
import { Message } from './domain/messages/entities/message.entity';
import { MessagesModule } from './application/messages/messages.module';
import { UserMessage } from './domain/messages/entities/user-message.entity';
import { LatestUserMessage } from './domain/messages/entities/latest-user-message.entity';

@Module({
  imports: [
    AccountsModule,
    AuthModule,
    ProfilesModule,
    ConversationsModule,

    TypeOrmModule.forRootAsync({
      useFactory() {
        return {
          type: "postgres",
          host: "localhost",
          port: 5432,
          username: "chat",
          password: "chat",
          database: "chat",
          schema: "public",
          entities: [
            Account, Profile, FullProfile, Contact, UserContact,  // accounts and profiles
            Conversation, Participation, UserConversation, // conversations
            Message, UserMessage, LatestUserMessage // messages
          ],
        };
      },
      async dataSourceFactory(options: any) {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    ConversationsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: LoggedInGuard,
    }
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {} 
}
