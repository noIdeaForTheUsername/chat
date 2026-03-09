import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";


export class PushSubscriptionDto {
  @IsObject()
  @IsOptional()
  subscription?: object;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  fcmToken?: string;


  @IsString()
  language: string;
}
