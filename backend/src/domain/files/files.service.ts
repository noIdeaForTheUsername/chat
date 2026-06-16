import { Injectable } from "@nestjs/common";
import { FileInfo } from "./entities/file-info.entity";
import { LessThan, MoreThan, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ViewedFileInfo } from "./entities/viewed-file-info";
import { Message } from "../messages/entities/message.entity";

@Injectable()
export class FilesDomainService {

  constructor(
    @InjectRepository(FileInfo)
    private readonly filesInfo: Repository<FileInfo>,
    @InjectRepository(ViewedFileInfo)
    private readonly extendedFilesInfo: Repository<ViewedFileInfo>
  ) {}

  async saveFileInfo(file: Express.Multer.File, messageId: number,
    mimeType: string, mimeTypeTrusted: boolean) {
    let fileInfo = this.filesInfo.create({
      uuid: file.filename.substring(0, file.filename.lastIndexOf('.')),
      messageId: messageId,
      uploadedAt: new Date(),
      originalName: file.originalname,
      mimeType: mimeType,
      mimeTypeTrusted: mimeTypeTrusted,
      sizeInBytes: file.size
    });
    return this.filesInfo.save(fileInfo);
  }

  async getExtendedFileInfo(uuid: string, viewerId: number) {
    return this.extendedFilesInfo.findOneBy({ uuid: uuid, viewerId: viewerId });
  }

  async getConversationFilesInfo(conversationId: number, minMessageId: number, maxMessageId: number)
  {
    return await this.filesInfo
      .createQueryBuilder('file')
      .innerJoin(
        Message,
        'message',
        'message.globalId = file.messageId',
      )
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('file.messageId BETWEEN :min AND :max', {
        min: minMessageId,
        max: maxMessageId,
      })
      .orderBy('message.globalId', 'DESC')
      .getMany();
  }
}