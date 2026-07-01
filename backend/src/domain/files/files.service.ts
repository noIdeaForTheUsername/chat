import { Injectable } from "@nestjs/common";
import { FileInfo } from "./entities/file-info.entity";
import { LessThan, MoreThan, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ViewedFileInfo } from "./entities/viewed-file-info";
import { Message } from "../messages/entities/message.entity";
import { FileTypeInfo } from "src/application/files/file-interfaces";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class FilesDomainService {

  constructor(
    @InjectRepository(FileInfo)
    private readonly filesInfo: Repository<FileInfo>,
    @InjectRepository(ViewedFileInfo)
    private readonly extendedFilesInfo: Repository<ViewedFileInfo>
  ) {}

  async saveFileInfo(file: Express.Multer.File, messageId: number, fileTypeInfo: FileTypeInfo) {
    let fileInfo = this.filesInfo.create({
      uuid: file.filename.substring(0, file.filename.lastIndexOf('.')),
      messageId: messageId,
      uploadedAt: new Date(),
      originalName: file.originalname,
      mimeType: fileTypeInfo.mimeType,
      mimeTypeTrusted: fileTypeInfo.mimeTypeTrusted,
      sizeInBytes: file.size,
      mediaWidth: fileTypeInfo.mediaWidth,
      mediaHeight: fileTypeInfo.mediaHeight
    });
    return this.filesInfo.save(fileInfo);
  }

  async getViewedFileInfo(uuid: string, viewerId: number) {
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

  async getMessageFiles(messageId: number) {
    return await this.filesInfo.findBy({ messageId: messageId });
  }

  async deleteMessageFiles(messageId: number) {
    return await this.filesInfo.delete({ messageId: messageId });
  }

  async deleteConversationUserFilesInfo(conversationId: number, userId: number /*user whose messages are to be deleted*/) {
    // DELETE FROM files_info INNER JOIN messages m ON files_info.message_id = m.global_id WHERE m.conversation_id = ? AND m.sender_id = ?
    await this.filesInfo.query(
      `DELETE FROM files_info fi
      USING messages m
      WHERE fi.message_id = m.global_id
        AND m.conversation_id = $1
        AND m.sender_id = $2
      `,
      [conversationId, userId],
    );
  }
}