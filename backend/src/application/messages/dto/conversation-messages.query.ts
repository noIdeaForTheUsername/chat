import { Type } from "class-transformer";
import { IsBoolean, IsBooleanString, IsInt, IsOptional } from "class-validator";

export class ConversationMessagesQuery {
  // @Type(() => Number)
  // @IsInt()
  // conversationId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  globalIdStart?: number;

  @IsOptional()
  @IsBooleanString()
  older?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit: number = 25;
}