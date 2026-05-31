import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";


export class PushSubscriptionDto {
  @IsObject()
  @IsOptional()
  subscription?: object;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(2000)
  fcmToken?: string;


  @IsString()
  @IsOptional()
  @MaxLength(2)
  language?: string;
}
