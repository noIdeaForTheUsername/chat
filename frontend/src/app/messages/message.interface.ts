export interface Message {
  globalId: number,
  conversationId: number,
  senderId: number,
  timestamp: Date,
  repliedId?: number,
  text?: string,  // no text + no file means "deleted"
  file?: string, // implement in future
}
