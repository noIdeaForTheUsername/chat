import { Type } from "class-transformer";
import { IsDate, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class SendMessageDto {
  @IsInt()
  conversationId: number;

  @IsNotEmpty()
  @IsString()
  text: string;

  // @IsNotEmpty()
  // @IsDate()
  // @Type(() => Date)
  // timestamp: Date;

  @IsOptional()
  @IsNumber()
  repliedId?: number;
}