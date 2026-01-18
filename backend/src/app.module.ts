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
import { LoggedInGuard } from './shared/auth/guards/logged-in.guard';
import { UserKnownProfile } from './domain/profiles/entities/user-known-profile.entity';
import { Profile } from './domain/profiles/entities/profile.entity';
import { FullProfile } from './domain/profiles/entities/full-profile.entity';
import { Contact } from './domain/contacts/entities/contact.entity';
import { ConversationsModule } from './application/conversations/conversations.module';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { AccountsModule } from './application/users/accounts/accounts.module';
import { ProfilesModule } from './application/users/profiles-and-contacts/profiles.module';
import { Message } from './domain/messages/entities/message.entity';
import { MessagesModule } from './application/messages/messages.module';
import { UserMessage } from './domain/messages/entities/user-message.entity';
import { LatestUserMessage } from './domain/messages/entities/latest-user-message.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './config';
import { AccountsDomainModule } from './domain/accounts/accounts.module';
import { AuthModule } from './application/users/auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DeviceSessionEntity } from './domain/session/entity/device-session.entity';
import { PushModule } from './application/push-notifications/push.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', load: [config] }),
    EventEmitterModule.forRoot(),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: "postgres",
        host: cfg.get<string>('database.host'),
        port: cfg.get<number>('database.port'),
        username: cfg.get<string>('database.username'),
        password: cfg.get<string>('database.password'),
        database: cfg.get<string>('database.database'),
        schema: "public",
        entities: [
          Account, Profile, FullProfile, Contact, UserKnownProfile,
          Conversation, Participation, UserConversation,
          Message, UserMessage, LatestUserMessage, DeviceSessionEntity
        ],
      }),
      async dataSourceFactory(options: any) {
        if (!options) throw new Error('Invalid options passed');
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    
    AuthModule,
    AccountsModule,
    ProfilesModule,
    ConversationsModule,
    MessagesModule,
    PushModule,
    AccountsDomainModule, // for LoggedInGuard
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
  constructor(private dataSource: DataSource, private config: ConfigService) {} 
}
