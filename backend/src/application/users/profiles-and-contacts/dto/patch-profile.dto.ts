import { Transform } from 'class-transformer';
import { IsBoolean, IsString, IsOptional } from 'class-validator';
import { EmptyToNull } from 'src/shared/validation/empty-to-null';

export class PatchProfileDto {
  @EmptyToNull()
  @IsOptional()
  @IsString()
  name?: string | null;

  @EmptyToNull()
  @IsOptional()
  @IsString()
  bio?: string | null;

  @IsOptional()
  @IsBoolean()
  emailPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  phoneNumberPublic?: boolean;
}
