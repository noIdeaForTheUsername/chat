import { ViewColumn, ViewEntity } from 'typeorm';
import { ConversationType } from './conversation-type.enum';

@ViewEntity('user_conversations')
export class UserConversation {
  @ViewColumn()
  id: number;

  @ViewColumn()
  type: ConversationType;

  @ViewColumn({ name: 'owner_id' })
  ownerId: number;

  @ViewColumn({ name: 'participant_id' })
  participantId: number;

  @ViewColumn()
  accepted: boolean;

  @ViewColumn()
  notifications: boolean;

  @ViewColumn({ name: 'newest_read_message_id' })
  newestReadMessageId: number | null;
}
