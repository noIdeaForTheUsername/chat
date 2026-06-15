import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ConversationType } from 'src/domain/conversations/entities/conversation-type.enum';
import { UserId } from 'src/shared/auth/decorators/user-id.decorator';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async getUserConversations(@UserId() userId: number) {
    // await new Promise((resolve) => setTimeout(() => resolve(null), 3000));
    return await this.conversationsService.getUserConversations(userId);
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
}
