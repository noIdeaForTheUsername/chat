import { Controller, Get } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { UserId } from 'src/shared/auth/user-id.decorator';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async getUserConversations(@UserId() userId: number) {
    return await this.conversationsService.getUserConversations(userId);
  }
}
