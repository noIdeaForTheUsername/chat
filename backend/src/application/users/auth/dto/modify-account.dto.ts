import { IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { NormalizeEmail } from "src/shared/validation/normalize-email";
import { NormalizePhone } from "src/shared/validation/normalize-phone";

export class ModifyAccountDto {
  @IsOptional()
  @IsEmail()
  @NormalizeEmail()
  email?: string | null;

  @IsOptional()
  @IsPhoneNumber()
  @NormalizePhone()
  phoneNumber?: string | null;

  @IsString()
  currentPassword: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  passwordRepeat?: string;
}