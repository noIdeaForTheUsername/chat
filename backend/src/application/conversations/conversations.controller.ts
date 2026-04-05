import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { UserId } from 'src/shared/auth/decorators/user-id.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationType } from 'src/domain/conversations/entities/conversation-type.enum';
import { throttle } from 'rxjs';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async getUserConversations(@UserId() userId: number) {
    return await this.conversationsService.getUserConversations(userId);
    // return await new Promise((resolve) => setTimeout(() => resolve(data), 3000));
  }

  @Get(':id')
  async getConversationById(@UserId() callerId: number, @Param('id', ParseIntPipe) conversationId: number) {
    return await this.conversationsService.getConversationById(callerId, conversationId);
  }

  @Post()
  async createConversation(@UserId() callerId: number, @Body() body: CreateConversationDto) {
    // Direct conversation
    if (body.type === ConversationType.DIRECT) {
      return await this.conversationsService.createConversation(callerId, body.type, body.participantId);
    }
    return undefined;
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  async acceptConversation(@UserId() callerId: number, @Param('id', ParseIntPipe) conversationId: number) {
    return await this.conversationsService.acceptConversation(callerId, conversationId);
  }
}
