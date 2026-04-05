import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";


export class PushSubscriptionDto {
  @IsObject()
  @IsOptional()
  subscription?: object;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(2000, { message: 'too-long' })
  fcmToken?: string;


  @IsString()
  @IsOptional()
  @MaxLength(2)
  language?: string;
}
