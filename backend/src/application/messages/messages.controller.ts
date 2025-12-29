import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { UserId } from 'src/shared/auth/user-id.decorator';
import { ConversationMessagesQuery } from './dto/conversation-messages.query';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get("previews")
  async getRecentMessagePreviews(@UserId() callerId: number) {
    return await this.messagesService.getRecentMessagePreviews(callerId);
  }

  @Get("conversation/:id")
  async getConversationMessages(
    @UserId() callerId: number,
    @Query() query: ConversationMessagesQuery
  ) {
    return await this.messagesService.getConversationMessages(
      callerId, query.conversationId, query.globalIdStart, query.older);
  }

  @Post()
  async sendMessage(
    @UserId() callerId: number,
    @Body() body: SendMessageDto
  ) {
    return await this.messagesService.sendMessage(
      callerId, body.conversationId, body.text, body.timestamp, body.repliedId);
  }
}
