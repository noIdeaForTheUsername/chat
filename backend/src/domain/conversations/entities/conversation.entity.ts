import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ConversationType } from './conversation-type.enum';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({ type: 'enum', enum: ConversationType })
  type: ConversationType;
}
