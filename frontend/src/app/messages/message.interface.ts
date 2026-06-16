import { FileInfo } from "../files/file-types";

export interface Message {
  globalId: number,
  conversationId: number,
  senderId: number,
  timestamp: Date,
  repliedId?: number,
  text?: string,  // no text + no file means "deleted"
  files?: FileInfo[],
}
