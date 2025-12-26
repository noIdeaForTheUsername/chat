import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConversationsModule } from './conversations/conversations.module';
import { Conversation } from './conversations/entities/conversation.entity';
import { Participation } from './conversations/entities/participation.entity';
import { UserConversation } from './conversations/entities/user-conversation.entity';
import { AccountsModule } from './accounts/accounts.module';
import { Account } from './accounts/entities/account.entity';
import { APP_GUARD } from '@nestjs/core';
import { LoggedInGuard } from './auth/verification/logged-in.guard';
import { ProfilesModule } from './profiles/profiles.module';

@Module({
  imports: [
    AuthModule,
    AccountsModule,
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "chat",
      password: "chat",
      database: "chat",
      schema: "public",
      entities: [Account, Conversation, Participation, UserConversation],
    }),
    ConversationsModule,
    ProfilesModule,
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
