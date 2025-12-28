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

  @Column()
  accepted: boolean;

  @Column()
  notifications: boolean;
}
