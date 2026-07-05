import { Type } from "class-transformer";
import { IsNumber, IsNumberString, IsOptional, IsString, MaxLength } from "class-validator";

export class MessageWithFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  repliedId?: number;
}