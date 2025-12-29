export class SendMessageDto {
  conversationId: number;
  text: string;
  timestamp: Date;
  repliedId?: number;
}