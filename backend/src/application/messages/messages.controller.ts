import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseArrayOptions, ParseArrayPipe, ParseIntPipe, Post, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { UserId } from 'src/shared/auth/decorators/user-id.decorator';
import { ConversationMessagesQuery } from './dto/conversation-messages.query';
import { SendMessageDto } from './dto/send-message.dto';
import { RateLimitedAction } from '../actions-rate-limiting/rate-limited-action.interface';
import { ActionsThrottlerService } from '../actions-rate-limiting/actions-throttler.service';


// Per-account rate limiting

const MESSAGE_SENDING_LIMIT: RateLimitedAction = {
  name: 'MESSAGE_SEND',
  limit: 10,
  ttl: 20 * 1000,
}
const MESSAGE_SENDING_LIMIT_2: RateLimitedAction = {
  name: 'MESSAGE_SEND_2',
  limit: 60,
  ttl: 4 * 60 * 1000,
}


@Controller()
export class MessagesController {

  private readonly maxMessagesLoadLimit = 100;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly actionsThrottler: ActionsThrottlerService
  ) {}

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
      callerId, conversationId, query.limit, query.globalIdStart, query.older === 'true');
  }

  @Get("conversations/:id/messages/batch")
  async getMessagesByIds(
    @UserId() callerId: number,
    @Param('id') conversationId: number,
    @Query('ids', new ParseArrayPipe({ items: Number })) messageIds: number[]
  ) {
    return await this.messagesService.getMessagesByIds(callerId, conversationId, messageIds);
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
    this.actionsThrottler.incrementAndThrow(MESSAGE_SENDING_LIMIT, callerId.toString());
    this.actionsThrottler.incrementAndThrow(MESSAGE_SENDING_LIMIT_2, callerId.toString());

    const message = await this.messagesService.sendMessage(
      callerId, body.conversationId, body.text, body.repliedId);
    return { id: message.globalId };
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