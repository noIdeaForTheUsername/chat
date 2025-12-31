export interface Message {
  globalId: number,
  numberInConversation: number,
  conversationId: number,
  senderId: number,
  timestamp: Date,
  repliedId?: number,
  text?: string,
  file?: string, // implement in future
}
