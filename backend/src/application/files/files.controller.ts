import { Body, Controller, Get, Header, Param, Post, Query, Res, StreamableFile, UploadedFiles, UseFilters, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from "@nestjs/platform-express";
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { UserId } from 'src/shared/auth/decorators/user-id.decorator';
import { MessagesService } from '../messages/messages.service';
import { MessageWithFileDto } from './dto/message-with-file.dto';
import { FileInfoResponse } from './file-interfaces';
import { FileUploadExceptionFilter } from './file-upload.filter';
import { FILES_UPLOAD_RATE_LIMIT } from './rate-limit';
import { FilesService } from './services/files.service';

const maxCacheAgeSeconds = 3600 * 24 * 60; // 60 days

@Controller()
export class FilesController {

  constructor(
    private readonly filesService: FilesService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get("conversations/:id/file-info")
  async getConversationFilesInfo(
    @UserId() callerId: number,
    @Param('id') conversationId: number,
    @Query('minMessageId') minMessageId: number,
    @Query('maxMessageId') maxMessageId: number,
  ): Promise<FileInfoResponse[]> {
    return await this.filesService.getConversationFilesInfo(callerId, conversationId, minMessageId, maxMessageId);
  }

  @Post("conversations/:id/uploads")
  @UseFilters(FileUploadExceptionFilter)
  @UseInterceptors(FilesInterceptor("files")) 
  @Throttle(FILES_UPLOAD_RATE_LIMIT)
  async sendMessageWithFiles(
    @UserId() callerId: number,
    @Param('id') conversationId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: MessageWithFileDto,
  ): Promise<{ id: number }> {

    // send message
    const message = await this.messagesService.sendMessage(callerId, conversationId, body.text ?? "", body.repliedId);

    // register files
    await this.filesService.processUploadedFiles(files, callerId, conversationId, message.globalId, !!body.text);

    return { id: message.globalId };
  }

  @Get("uploads/:uuid")
  @SkipThrottle({ fiveSeconds: true })
  @Throttle({
    minute: {
      ttl: 60 * 1000,
      limit: 500,  // tolerate the user scrolling like crazy in a conversation full of files
    }
  })
  @Header("Cache-Control", `private, max-age=${maxCacheAgeSeconds}, immutable`)
  async serveFile(
    @Param('uuid') fileUuid: string,
    @UserId() callerId: number,
    @Query('download') download: any,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    return await this.filesService.serveFile(fileUuid, callerId, res, !!download);
  }
}

