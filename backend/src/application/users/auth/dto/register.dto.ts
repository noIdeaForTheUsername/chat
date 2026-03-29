import { IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';
import { NormalizeName } from 'src/shared/validation/normalize-name';
import { NormalizePhone } from 'src/shared/validation/normalize-phone';

export class RegisterDto {
  @IsPhoneNumber()
  @NormalizePhone()
  phoneNumber: string;

  @IsString()
  @MaxLength(100)
  password: string;

  @IsString()
  @MaxLength(100)
  passwordRepeat: string;

  @IsString()
  @MaxLength(100)
  @NormalizeName()
  name: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;
}
