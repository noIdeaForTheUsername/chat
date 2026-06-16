import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getFileDiskStorage } from './file-storage';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  imports: [
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
