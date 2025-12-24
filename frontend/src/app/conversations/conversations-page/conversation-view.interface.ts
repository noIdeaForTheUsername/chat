import { Conversation } from "@app/conversations/conversation.interface"

export interface ConversationView extends Conversation {
  lastMessageText: string,
  unreadMessages: number
}