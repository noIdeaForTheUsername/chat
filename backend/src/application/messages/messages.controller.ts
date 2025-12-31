import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { UserId } from 'src/shared/auth/user-id.decorator';
import { ConversationMessagesQuery } from './dto/conversation-messages.query';
import { SendMessageDto } from './dto/send-message.dto';

@Controller()
export class MessagesController {

  private readonly maxMessagesLoadLimit = 100;

  constructor(private readonly messagesService: MessagesService) {}

  @Get("message-previews")
  async getRecentMessagePreviews(@UserId() callerId: number) {
    return await this.messagesService.getRecentMessagePreviews(callerId);
  }

  @Get("conversations/:id/messages")
  async getConversationMessages(
    @UserId() callerId: number,
    @Param('id') conversationId: number,
    @Query() query: ConversationMessagesQuery
  ) {
    if (query.globalIdStart === 0)
      query.globalIdStart = undefined;
    if (query.limit <= 0 || query.limit > this.maxMessagesLoadLimit)
      throw new BadRequestException(`Limit must be between 1 and ${this.maxMessagesLoadLimit}`);
    return await this.messagesService.getConversationMessages(
      callerId, conversationId, query.limit, query.globalIdStart, query.older);
  }

  @Post("conversations/:id/messages")
  async sendMessage(
    @UserId() callerId: number,
    @Body() body: SendMessageDto
  ) {
    const id = await this.messagesService.sendMessage(
      callerId, body.conversationId, body.text, body.timestamp, body.repliedId);
    return { id };
  }
}
