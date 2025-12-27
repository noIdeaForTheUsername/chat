import { IsString } from "class-validator";

export class PatchProfileDto {
  @IsString()
  name: string;

  @IsString()
  bio: string;
}