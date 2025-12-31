import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional } from "class-validator";

export class ConversationMessagesQuery {
  // @Type(() => Number)
  // @IsInt()
  // conversationId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  globalIdStart?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  older?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit: number = 25;
}