import { IsPhoneNumber, IsString } from 'class-validator';
import { NormalizePhone } from 'src/shared/validation/normalize-phone';

export class LoginDto {
  @IsString()
  @IsPhoneNumber()
  @NormalizePhone()
  phoneNumber: string;  // account login, email or phone number
  @IsString()
  password: string;
}
