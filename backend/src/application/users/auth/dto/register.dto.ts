import { IsOptional, IsPhoneNumber, IsString, MaxLength, MinLength } from 'class-validator';
import { NormalizeName } from 'src/shared/validation/normalize-name';
import { NormalizePhone } from 'src/shared/validation/normalize-phone';

export class RegisterDto {
  @IsPhoneNumber()
  @NormalizePhone()
  phoneNumber: string;

  @IsString()
  @MinLength(10)
  @MaxLength(100)
  password: string;

  @IsString()
  @MinLength(10)
  @MaxLength(100)
  passwordRepeat: string;

  @IsString()
  @MaxLength(60)
  @NormalizeName()
  name: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
