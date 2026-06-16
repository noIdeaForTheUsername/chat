import { Injectable, NotFoundException } from '@nestjs/common';
import { fileTypeFromFile } from "file-type";
import { FileInfo } from 'src/domain/files/entities/file-info.entity';
import { FilesDomainService } from 'src/domain/files/files.service';
import { FileInfoResponse, FileTypeResponse } from './dto/file-info-response.dto';
import { ConversationsDomainService } from 'src/domain/conversations/conversations.service';
import { ViewedFileInfo } from 'src/domain/files/entities/viewed-file-info';
import { FilesStorageService } from './files-storage.service';
import { Response } from 'express';


// The file upload and writing themseleves are performed by Multer in FileInterceptor.
// This service manages metadata and downloads

@Injectable()
export class FilesService {

  constructor(
    private readonly filesInfo: FilesDomainService,
    private readonly storage: FilesStorageService,
    private readonly conversationsService: ConversationsDomainService
  ) {}
  
  async registerUploadedFile(file: Express.Multer.File, messageId: number) {
    const detectedFileType = await fileTypeFromFile(file.path);
    if (!detectedFileType)
      await this.filesInfo.saveFileInfo(file, messageId, file.mimetype, false);
    else
      await this.filesInfo.saveFileInfo(file, messageId, detectedFileType.mime, true);
  }

  async serveFile(uuid: string, callerId: number, res: Response) {
    uuid = uuid.toLowerCase().substring(0, 36);
    const info = await this.filesInfo.getExtendedFileInfo(uuid, callerId);
    if (!info)
      throw new NotFoundException();

    const type = this.getFileTypeResponse(info);
    res.setHeader("Content-Type", info.mimeType);
    if (type === "downloadable") {
      res.setHeader("Content-Disposition", `attachment; filename="${info.originalName}"`);
    }
    return await this.storage.getFileResponseStream(uuid);
  }

  async getConversationFilesInfo(callerId: number, conversationId: number, minMessageId: number, maxMessageId: number): Promise<FileInfoResponse[]> {
    // assert user has access to the conversation
    if (!await this.conversationsService.findUserConversation(callerId, conversationId))
      throw new NotFoundException();

    let filesInfo = await this.filesInfo.getConversationFilesInfo(conversationId, minMessageId, maxMessageId);
    return filesInfo.map(file => this.convertFileInfoToResponse(file));
  }

  private convertFileInfoToResponse(fileInfo: FileInfo): FileInfoResponse {
    let returnedMime = this.getFileTypeResponse(fileInfo);
    
    return {
      uuid: fileInfo.uuid,
      messageId: fileInfo.messageId,
      uploadedAt: fileInfo.uploadedAt,
      originalName: fileInfo.originalName,
      type: returnedMime,
      sizeInBytes: fileInfo.sizeInBytes
    }
  }

  private getFileTypeResponse(fileInfo: FileInfo | ViewedFileInfo): FileTypeResponse {
    let fileType: FileTypeResponse = "downloadable";
    if (fileInfo.mimeTypeTrusted) {
      if (fileInfo.mimeType.includes("image"))
        fileType = "image";
      else if (fileInfo.mimeType.includes("video"))
        fileType = "video";
    }
    return fileType;
  }
}
