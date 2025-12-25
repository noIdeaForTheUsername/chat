import { IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator";

export class RegisterDto {
  @IsString()
  login: string;
  @IsString()
  password: string;
  @IsString()
  passwordRepeat: string;
  
  @IsOptional()
  @IsEmail()
  email?: string;
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;
}
