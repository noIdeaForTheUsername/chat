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

  @Column({ name: "replied_id", type: "int", nullable: true, transformer: { to: _ => _, from: (value) =>
    typeof value === "string" ? Number(value) : value } })
  repliedId: number | null;
}