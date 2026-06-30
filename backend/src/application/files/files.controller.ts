import { Body, Controller, Get, Param, Post, Query, Res, StreamableFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FilesInterceptor } from "@nestjs/platform-express";
import type { Response } from 'express';
import { UserId } from 'src/shared/auth/decorators/user-id.decorator';
import { MessagesService } from '../messages/messages.service';
import { MessageWithFileDto } from './dto/message-with-file.dto';
import { FileInfoResponse } from './file-interfaces';
import { FilesService } from './services/files.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly messagesService: MessagesService,
    private readonly eventEmitter: EventEmitter2
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
  @UseInterceptors(FilesInterceptor("files")) 
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
  @SkipThrottle({ fiveSeconds: false })
  async serveFile(
    @Param('uuid') fileUuid: string,
    @UserId() callerId: number,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    return await this.filesService.serveFile(fileUuid, callerId, res);
  }
}

