import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { FilesDomainModule } from 'src/domain/files/files.module';
import { FilesController } from './files.controller';
import { FilesService } from './services/files.service';
import { MessagesModule } from '../messages/messages.module';
import { FilesStorageService } from './services/files-storage.service';
import { ConversationsDomainModule } from 'src/domain/conversations/conversations.module';
import { FileTypesService } from './services/file-types.service';
import { NotBlockingParticipantsModule } from '../shared/not-blocking-participants/not-blocking-participants.module';
import { LoggingModule } from 'src/shared/logging/logging.module';
import { FilesDomainService } from 'src/domain/files/files.service';
import { LoggingService } from 'src/shared/logging/app-logger';

@Module({
  controllers: [FilesController],
  providers: [FilesService, FileTypesService, FilesStorageService],
  imports: [
    MessagesModule,
    ConversationsDomainModule,
    FilesDomainModule,
    NotBlockingParticipantsModule,
    LoggingModule,
    MulterModule.registerAsync({
      imports: [ConfigModule, FilesDomainModule, LoggingModule],
      inject: [ConfigService, FilesDomainService, LoggingService],
      useFactory: async (configService: ConfigService,
      filesDomainService: FilesDomainService, loggingService: LoggingService) => ({
        storage: new FilesStorageService(configService, filesDomainService, loggingService).getMulterFileDiskStorage(),
        limits: {
          files: 20,
        }
      }),
    }),
  ]
})
export class FilesModule {}
