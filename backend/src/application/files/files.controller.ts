import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { PublicAccess } from 'src/shared/auth/decorators/public-access.decorator';
import { FilesService } from './files.service';
import { SendMessageDto } from '../messages/dto/send-message.dto';
import { MessagesService } from '../messages/messages.service';
import { UserId } from 'src/shared/auth/decorators/user-id.decorator';

@Controller()
@PublicAccess()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly messagesService: MessagesService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log("Uploaded file:", file);
  }

  @Post("conversations/:id/uploads")
  @UseInterceptors(FilesInterceptor("files")) 
  async sendMessageWithFiles(
    @UserId() callerId: number,
    @Param('id') conversationId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: SendMessageDto,
  ) {
    const message = await this.messagesService.sendMessage(callerId, conversationId, body.text, body.repliedId);
    return { id: message.globalId };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
  
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    
  }
}
