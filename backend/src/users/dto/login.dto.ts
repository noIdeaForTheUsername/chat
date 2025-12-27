import { IsString } from "class-validator";

export class LoginDto {
  @IsString()
  account: string;  // account login, email or phone number
  @IsString()
  password: string;
}