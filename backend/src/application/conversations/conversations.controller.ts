import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { UserId } from 'src/shared/auth/user-id.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationType } from 'src/domain/conversations/entities/conversation-type.enum';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async getUserConversations(@UserId() userId: number) {
    return await this.conversationsService.getUserConversations(userId);
  }

  @Post()
  async createConversation(@UserId() callerId: number, @Body() body: CreateConversationDto) {
    // Direct conversation
    if (body.type === ConversationType.Direct) {
      return this.conversationsService.createConversation(callerId, body);
    }
    // TODO: group conversation
    return undefined;
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  async acceptConversation(@UserId() callerId: number, @Param('id', ParseIntPipe) conversationId: number) {
    return await this.conversationsService.acceptConversation(callerId, conversationId);
  }

  @Delete(':id')
  async deleteConversation(@UserId() callerId: number, @Param('id', ParseIntPipe) conversationId: number) {
    return await this.conversationsService.deleteConversation(callerId, conversationId);
  }
}
