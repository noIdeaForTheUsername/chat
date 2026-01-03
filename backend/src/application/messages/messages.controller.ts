import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseArrayOptions, ParseArrayPipe, ParseIntPipe, Post, Query } from '@nestjs/common';
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

  @Get("conversations/:id/messages/:messageId")
  async getMessageById(
    @UserId() callerId: number,
    @Param('id') conversationId: number,
    @Param('messageId') messageId: number
  ) {
    return await this.messagesService.getMessageById(callerId, conversationId, messageId);
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

  @Delete("conversations/:id/messages/all")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllConversationMessages(
    @UserId() callerId: number,
    @Param('id', ParseIntPipe) conversationId: number
  ) {
    await this.messagesService.deleteAllConversationMessages(callerId, conversationId);
  }

  @Delete("conversations/:id/messages/:messageId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessageById(
    @UserId() callerId: number,
    @Param('id', ParseIntPipe) conversationId: number,
    @Param('messageId', ParseIntPipe) messageId: number
  ) {
    await this.messagesService.deleteMessageById(callerId, conversationId, messageId);
  }

  @Delete("conversations/:id/messages")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMultipleMessages(
    @UserId() callerId: number,
    @Param('id', ParseIntPipe) conversationId: number,
    @Body('ids', new ParseArrayPipe({ items: Number })) messageIds: number[]
  ) {
    await this.messagesService.deleteMultipleMessages(callerId, conversationId, messageIds);
  }
}