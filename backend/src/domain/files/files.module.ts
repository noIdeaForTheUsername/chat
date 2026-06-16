import { Module } from "@nestjs/common";
import { FilesDomainService } from "./files.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileInfo } from "./entities/file-info.entity";
import { ViewedFileInfo } from "./entities/viewed-file-info";
import { Message } from "../messages/entities/message.entity";


@Module({
  imports: [
    TypeOrmModule.forFeature([FileInfo, ViewedFileInfo, Message]),
  ],
  providers: [FilesDomainService],
  exports: [FilesDomainService],
})
export class FilesDomainModule {

}