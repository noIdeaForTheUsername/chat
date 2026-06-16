import { Body, Controller, Get, NotFoundException, Param, Post, Query, Res, StreamableFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from "@nestjs/platform-express";
import { UserId } from 'src/shared/auth/decorators/user-id.decorator';
import { SendMessageDto } from '../messages/dto/send-message.dto';
import { MessagesService } from '../messages/messages.service';
import { FileInfoResponse } from './dto/file-info-response.dto';
import { FilesService } from './files.service';
import type { Response } from 'express';

@Controller()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly messagesService: MessagesService
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
    @Body() body: SendMessageDto,
  ): Promise<{ id: number }> {
    const message = await this.messagesService.sendMessage(callerId, conversationId, body.text, body.repliedId);
    let promises: Promise<void>[] = [];
    for (const file of files) {
      promises.push(this.filesService.registerUploadedFile(file, message.globalId));
    }
    await Promise.all(promises);
    return { id: message.globalId };
  }

  @Get("uploads/:uuid")
  async serveFile(
    @Param('uuid') fileUuid: string,
    @UserId() callerId: number,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    console.log("serveFilecalled!");
    return await this.filesService.serveFile(fileUuid, callerId, res);
  }
}
