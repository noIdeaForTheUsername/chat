import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn({ name: "global_id" })
  globalId: number;

  @Column({ name: "conversation_id" })
  conversationId: number;

  @Column({ name: "sender_id" })
  senderId: number;

  @Column()
  text: string;

  @Column()
  timestamp: Date;

  @Column({ name: "replied_id", nullable: true })
  repliedId?: number;
}