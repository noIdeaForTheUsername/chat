import { IsOptional, IsPhoneNumber, IsString, Max, MaxLength } from "class-validator";
import { NormalizePhone } from "src/shared/validation/normalize-phone";

export class ModifyAccountDto {
  @IsOptional()
  @IsPhoneNumber()
  @NormalizePhone()
  phoneNumber?: string;

  @IsString()
  @MaxLength(100)
  currentPassword: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  passwordRepeat?: string;
}