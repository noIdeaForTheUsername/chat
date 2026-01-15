import { IsNumber } from "class-validator";

export class MessageAcknowledgeDto {
  @IsNumber()
  conversationId: number;
  // @IsNumber()
  // messageId: number;
}