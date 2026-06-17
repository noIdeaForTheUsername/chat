import { Injectable, NotFoundException } from '@nestjs/common';
import { FileInfo } from 'src/domain/files/entities/file-info.entity';
import { FilesDomainService } from 'src/domain/files/files.service';
import { FileInfoResponse, AppFileType } from '../file-interfaces';
import { ConversationsDomainService } from 'src/domain/conversations/conversations.service';
import { ViewedFileInfo } from 'src/domain/files/entities/viewed-file-info';
import { FilesStorageService } from './files-storage.service';
import { Response } from 'express';
import { imageSizeFromFile } from 'image-size/fromFile';
import { FileTypesService } from './file-types.service';

// The file upload and writing themseleves are performed by Multer in FileInterceptor.
// This service manages metadata and downloads

@Injectable()
export class FilesService {

  constructor(
    private readonly domainService: FilesDomainService,
    private readonly fileTypes: FileTypesService,
    private readonly storage: FilesStorageService,
    private readonly conversationsService: ConversationsDomainService
  ) {}
  
  async registerUploadedFile(file: Express.Multer.File, messageId: number) {
    const fileTypeInfo = await this.fileTypes.getFileInfo(file);
    await this.domainService.saveFileInfo(file, messageId, fileTypeInfo);
  }

  async serveFile(uuid: string, callerId: number, res: Response) {
    uuid = this.normalizeUuid(uuid);
    const info = await this.domainService.getViewedFileInfo(uuid, callerId);
    if (!info)
      throw new NotFoundException();

    this.setFileResponseHeaders(res, info);
    return await this.storage.getFileResponseStream(uuid);
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
      res.setHeader("Content-Disposition", `attachment; filename="${info.originalName}"`);
    }
  }
}
