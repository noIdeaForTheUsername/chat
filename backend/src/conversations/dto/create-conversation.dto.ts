import { IsEnum, IsInt, IsOptional } from "class-validator";
import { ConversationType } from "../entities/conversation-type.enum";

export class CreateConversationDto {
  @IsEnum(ConversationType)
  type: ConversationType;

  @IsOptional()
  @IsInt()
  participantId?: number;
}