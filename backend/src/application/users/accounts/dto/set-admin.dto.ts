import { IsBoolean, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class SetAdminStatusDto {
  @IsBoolean()
  isAdmin: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password: string;
}