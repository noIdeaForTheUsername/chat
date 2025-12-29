import { Type } from "class-transformer";
import { IsBoolean, IsInt } from "class-validator";

export class ConversationMessagesQuery {
  @Type(() => Number)
  @IsInt()
  conversationId: number;

  @Type(() => Number)
  @IsInt()
  globalIdStart: number;

  @Type(() => Boolean)
  @IsBoolean()
  older: boolean;
}