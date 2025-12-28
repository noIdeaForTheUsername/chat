import { IsBoolean, IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { NormalizePhone } from 'src/shared/validation/normalize-phone';

export class RegisterDto {
  @IsString()
  login: string;
  @IsString()
  password: string;
  @IsString()
  passwordRepeat: string;

  @IsBoolean()
  emailPublic: boolean;
  @IsBoolean()
  phoneNumberPublic: boolean;
  
  @IsOptional()
  @IsEmail()
  email?: string;
  @IsOptional()
  @IsPhoneNumber()
  @NormalizePhone()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsString()
  bio?: string;
}
