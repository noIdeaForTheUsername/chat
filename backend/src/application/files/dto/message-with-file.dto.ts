import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class MessageWithFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string;


  @IsOptional()
  @IsNumber()
  repliedId?: number;
}