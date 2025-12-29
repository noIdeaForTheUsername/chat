import { BadRequestException, Injectable } from '@nestjs/common';
import { ConversationsDomainService } from 'src/domain/conversations/conversations.service';
import { ConversationType } from 'src/domain/conversations/entities/conversation-type.enum';
import { MessagesDomainService } from 'src/domain/messages/messages.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversations: ConversationsDomainService,
  ) {}

  getUserConversations(userId: number) {
    return this.conversations.findUserConversations(userId);
  }

  async createConversation(callerId: number, body: { type: ConversationType; participantId?: number }) {
    if (body.type === ConversationType.Direct) {
      if (!body.participantId) throw new BadRequestException('participantId is required for direct conversations');
      if (body.participantId === callerId) throw new BadRequestException('partcipantId cannot be your own user ID');
      return this.conversations.createDirectConversation(callerId, body.participantId);
    }
    // TODO: group conversation
    return undefined;
  }

  acceptConversation(callerId: number, conversationId: number) {
    return this.conversations.acceptConversation(callerId, conversationId);
  }

  async deleteConversation(callerId: number, conversationId: number) {
    const conversation = await this.conversations.findUserConversation(callerId, conversationId, true);
    return this.conversations.deleteConversation(conversationId);
  }
}
