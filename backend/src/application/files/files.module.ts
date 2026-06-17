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

@Module({
  controllers: [FilesController],
  providers: [FilesService, FileTypesService, FilesStorageService],
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
