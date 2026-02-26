import { IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { NormalizePhone } from "src/shared/validation/normalize-phone";

export class ModifyAccountDto {
  @IsOptional()
  @IsPhoneNumber()
  @NormalizePhone()
  phoneNumber: string;

  @IsString()
  currentPassword: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  passwordRepeat?: string;
}