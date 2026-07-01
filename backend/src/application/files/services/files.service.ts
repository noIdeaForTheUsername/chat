import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Response } from 'express';
import { NotBlockingParticipantsService } from 'src/application/shared/not-blocking-participants/not-blocking-participants.service';
import { ConversationsDomainService } from 'src/domain/conversations/conversations.service';
import { FileInfo } from 'src/domain/files/entities/file-info.entity';
import { ViewedFileInfo } from 'src/domain/files/entities/viewed-file-info';
import { FilesDomainService } from 'src/domain/files/files.service';
import { FilesSentEvent as FilesSentEvent } from 'src/shared/events/messages/files-sent.event';
import { FileInfoResponse } from '../file-interfaces';
import { FileTypesService } from './file-types.service';
import { FilesStorageService } from './files-storage.service';
import { MessageDeletedEvent } from 'src/shared/events/messages/message-deleted.event';
import { ConversationClearedEvent } from 'src/shared/events/conversation-cleared.event';

// The file upload and writing themseleves are performed by Multer in FileInterceptor.
// This service manages metadata and downloads

@Injectable()
export class FilesService {

  constructor(
    private readonly domainService: FilesDomainService,
    private readonly fileTypes: FileTypesService,
    private readonly storage: FilesStorageService,
    private readonly conversationsService: ConversationsDomainService,
    private readonly notBlockingParticipantsService: NotBlockingParticipantsService,
    private readonly eventEmitter: EventEmitter2
  ) {}


  async processUploadedFiles(files: Express.Multer.File[], senderId: number,
    conversationId: number, messageId: number, messageContainsText: boolean
  ): Promise<void> {
    files.forEach(file =>
      file.originalname = this.getUtf8FileName(file.originalname)
    );
    const filesInfo = await Promise.all(
      files.map((file) => this.processUploadedFile(file, messageId))
    );
    const filesInfoResponse = filesInfo.map(file => this.fileTypes.convertFileInfoToResponse(file));
    
    let participants = await this.notBlockingParticipantsService.getNotBlockingParticipantsIds(conversationId, senderId);
    this.eventEmitter.emit("filesSent", new FilesSentEvent(
      senderId,
      participants,
      conversationId,
      messageId,
      messageContainsText,
      filesInfoResponse
    ));
  }

  private async processUploadedFile(file: Express.Multer.File, messageId: number): Promise<FileInfo> {
    const fileTypeInfo = await this.fileTypes.getFileInfo(file);
    return await this.domainService.saveFileInfo(file, messageId, fileTypeInfo);
  }

  async serveFile(uuid: string, callerId: number, res: Response) {
    uuid = this.normalizeUuid(uuid);
    const info = await this.domainService.getViewedFileInfo(uuid, callerId);
    if (!info)
      throw new NotFoundException();

    // this order of operations helps avoid Content-Type mismatch on exceptions
    const fileStream = await this.storage.getFileResponseStream(uuid);
    this.setFileResponseHeaders(res, info);
    return fileStream;
  }

  async getConversationFilesInfo(callerId: number, conversationId: number, minMessageId: number, maxMessageId: number): Promise<FileInfoResponse[]> {
    // assert user has access to the conversation
    if (!await this.conversationsService.findUserConversation(callerId, conversationId))
      throw new NotFoundException();

    let filesInfo = await this.domainService.getConversationFilesInfo(conversationId, minMessageId, maxMessageId);
    return filesInfo.map(file => this.fileTypes.convertFileInfoToResponse(file));
  }

  private normalizeUuid(uuid: string): string {
    let lastIndexOfDot = uuid.lastIndexOf('.');
    return uuid.toLowerCase().substring(
      0, Math.min(36, lastIndexOfDot >= 0 ? lastIndexOfDot : uuid.length)
    );
  }

  private setFileResponseHeaders(res: Response, info: FileInfo | ViewedFileInfo) {
    const type = this.fileTypes.getAppFileType(info);
    res.setHeader("Content-Type", info.mimeType);
    if (type === "downloadable") {
      res.setHeader("Content-Disposition", `attachment; filename="${this.getLatin1FileName(info.originalName)}"`);
    }
  }

  private getUtf8FileName(latin1Filename: string): string {
    return Buffer.from(latin1Filename, 'latin1').toString('utf8');
  }

  private getLatin1FileName(utf8Filename: string): string {
    return Buffer.from(utf8Filename, 'utf8').toString('latin1');
  }

  @OnEvent("messageDeleted")
  async handleMessageDeleted(payload: MessageDeletedEvent) {
    const fileInfos = await this.domainService.getMessageFiles(payload.message.globalId);
    if (fileInfos.length === 0)
      return;

    let deletions: Promise<any>[] = [
      this.domainService.deleteMessageFiles(payload.message.globalId)  // DB deletion
    ];
    deletions.push(...fileInfos.map(fileInfo => this.storage.deleteFileFromDisk(fileInfo.uuid)));  // Filesystem deletions
    await Promise.all(deletions);
  }

  @OnEvent("conversationCleared")
  async handleConversationCleared(payload: ConversationClearedEvent) {
    this.domainService.deleteConversationUserFilesInfo(payload.conversationId, payload.callerId);
  }
}
