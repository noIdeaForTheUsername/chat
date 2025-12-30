import { IsBoolean, IsString } from 'class-validator';

export class PatchProfileDto {
  @IsString()
  name: string;

  @IsString()
  bio: string;

  @IsBoolean()
  emailPublic: boolean;

  @IsBoolean()
  phoneNumberPublic: boolean;
}
