export interface ServerMessage {
  id: number,
  conversationId: number,
  senderId: number,
  isoTimestamp: string,
  text?: string,
  file?: string, // implement in future
  repliedId?: number,
}
