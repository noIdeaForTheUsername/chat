import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity("contacts")
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @Column({ name: 'participant_id' })
  participantId: number;

  @Column({ default: false })
  blocked: boolean;

  @Column({ nullable: true })
  nick?: string;
}
