import { IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { NormalizePhone } from "src/shared/validation/normalize-phone";

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
  @NormalizePhone()
  phoneNumber?: string;
}
