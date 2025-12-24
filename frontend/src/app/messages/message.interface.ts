export interface Message {
  id: number,
  conversationId: number,
  senderId: number,
  isOwn: boolean,
  timestamp: Date,
  repliedId?: number,
  repliedText?: string,
  text?: string,
  file?: string, // implement in future
}
