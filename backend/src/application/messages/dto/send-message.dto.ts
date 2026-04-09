import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(4000)
  text: string;


  @IsOptional()
  @IsNumber()
  repliedId?: number;
}