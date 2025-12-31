import { IsBoolean, IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { NormalizeEmail } from 'src/shared/validation/normalize-email';
import { NormalizeLogin } from 'src/shared/validation/normalize-login';
import { NormalizeName } from 'src/shared/validation/normalize-name';
import { NormalizePhone } from 'src/shared/validation/normalize-phone';

export class RegisterDto {
  @IsString()
  @NormalizeLogin()
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
  @NormalizeEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  @NormalizePhone()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @NormalizeName()
  name?: string;
  
  @IsOptional()
  @IsString()
  bio?: string;
}
