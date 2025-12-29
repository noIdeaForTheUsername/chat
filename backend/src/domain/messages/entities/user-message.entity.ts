import { ViewColumn, ViewEntity } from "typeorm";

// All messages that a specific user has access to, for every Participation.user_id
@ViewEntity("user_messages")
export class UserMessage {
  @ViewColumn({ name: "global_id" })
  globalId: number;

  @ViewColumn({ name: "conversation_id" })
  conversationId: number;

  @ViewColumn({ name: "sender_id" })
  senderId: number;

  @ViewColumn()
  text: string;

  @ViewColumn()
  timestamp: Date;

  @ViewColumn({ name: "replied_id" })
  repliedId?: number;

  @ViewColumn()
  userId: number;  // Refers to a user who HAS ACCESS to the specified message
}