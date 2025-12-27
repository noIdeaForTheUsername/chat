import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConversationsModule } from './conversations/conversations.module';
import { Conversation } from './conversations/entities/conversation.entity';
import { Participation } from './conversations/entities/participation.entity';
import { UserConversation } from './conversations/entities/user-conversation.entity';
import { AccountsModule } from './users/accounts/accounts.module';
import { Account } from './users/accounts/entities/account.entity';
import { APP_GUARD } from '@nestjs/core';
import { LoggedInGuard } from './users/accounts/logged-in.guard';
import { ProfilesModule } from './users/profiles/profiles.module';
import { UserContact } from './users/profiles/entities/user-contact.entity';
import { Profile } from './users/profiles/entities/profile.entity';
import { FullProfile } from './users/profiles/entities/full-profile.entity';
import { Contact } from './users/profiles/entities/contact.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AccountsModule,
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "chat",
      password: "chat",
      database: "chat",
      schema: "public",
      entities: [
        Account, Profile, FullProfile, Contact, UserContact,  // accounts and profiles
        Conversation, Participation, UserConversation,  // conversations
      ],
    }),
    ConversationsModule,
    ProfilesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {} 
}
