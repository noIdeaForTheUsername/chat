import { IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { NormalizeName } from 'src/shared/validation/normalize-name';
import { NormalizePhone } from 'src/shared/validation/normalize-phone';

export class RegisterDto {
  @IsPhoneNumber()
  @NormalizePhone()
  phoneNumber: string;

  @IsString()
  password: string;

  @IsString()
  passwordRepeat: string;

  @IsString()
  @NormalizeName()
  name: string;
  
  @IsOptional()
  @IsString()
  bio?: string;
}
