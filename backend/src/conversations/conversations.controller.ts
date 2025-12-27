import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { UserId } from 'src/shared/auth/user-id.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationType } from './entities/conversation-type.enum';

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
    if (body.type == ConversationType.Direct) {
      if (!body.participantId) throw new BadRequestException('participantId is required for direct conversations');
      if (body.participantId == callerId) throw new BadRequestException('partcipantId cannot be your own user ID');
      
      const created = await this.conversationsService.createDirectConversation(callerId, body.participantId);
      return created;
    }
    // TODO: group conversation
    else {

    }
  }

  @Post(":id/accept")
  @HttpCode(HttpStatus.NO_CONTENT)
  async acceptConversation(
    @UserId() callerId: number,
    @Param("id", ParseIntPipe) conversationId: number
  ) {
    return await this.conversationsService.acceptConversation(callerId, conversationId);
  }
}
