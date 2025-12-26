import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "owner_id" })
  ownerId: number;

  @Column({ name: "participant_id" })
  participantId: number;

  @Column({ default: false })
  blocked: boolean;

  @Column()
  nick?: string;
}