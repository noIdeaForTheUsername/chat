import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Represents a user's settings for a conversation.
// A user can only have one Participation per Conversation.
@Entity('participations')
export class Participation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'conversation_id' })
  conversationId: number;

  @Column({ name: 'newest_read_message_id', nullable: true, type: "bigint" })
  newestReadMessageId: number | null;
}
