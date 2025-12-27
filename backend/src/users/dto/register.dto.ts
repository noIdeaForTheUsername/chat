import { IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { NormalizePhone } from "src/shared/validation/normalize-phone";

export class RegisterDto {
  // login data
  @IsString()
  login: string;
  @IsString()
  password: string;
  @IsString()
  passwordRepeat: string;
  
  // additional account data
  @IsOptional()
  @IsEmail()
  email?: string;
  @IsOptional()
  @IsPhoneNumber()
  @NormalizePhone()
  phoneNumber?: string;

  // profile data
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsString()
  bio?: string;
}
