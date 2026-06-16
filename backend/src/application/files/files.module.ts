import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { FilesDomainModule } from 'src/domain/files/files.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { MessagesModule } from '../messages/messages.module';
import { FilesStorageService } from './files-storage.service';
import { ConversationsDomainModule } from 'src/domain/conversations/conversations.module';

@Module({
  controllers: [FilesController],
  providers: [FilesService, FilesStorageService],
  imports: [
    MessagesModule,
    ConversationsDomainModule,
    FilesDomainModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        storage: new FilesStorageService(configService).getMulterFileDiskStorage(),
        limits: {
          files: 20,
        }
      }),
    }),
  ]
})
export class FilesModule {}
