import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class SetAdminStatusDto {
  @IsBoolean()
  isAdmin: boolean;

  @IsString()
  @IsNotEmpty()
  password: string;
}