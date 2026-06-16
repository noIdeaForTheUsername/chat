import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getFileDiskStorage } from './file-storage';
import { MessagesModule } from '../messages/messages.module';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  imports: [
    MessagesModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        storage: getFileDiskStorage(configService),
      }),
    }),
  ]
})
export class FilesModule {}
