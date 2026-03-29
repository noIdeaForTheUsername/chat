import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class SendMessageDto {
  @IsInt()
  conversationId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(4000, { message: 'too-long' })
  text: string;


  @IsOptional()
  @IsNumber()
  repliedId?: number;
}