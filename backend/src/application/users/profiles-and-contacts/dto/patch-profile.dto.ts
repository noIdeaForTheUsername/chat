import { IsString, IsOptional } from 'class-validator';
import { EmptyToNull } from 'src/shared/validation/empty-to-null';

export class PatchProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @EmptyToNull()
  @IsOptional()
  @IsString()
  bio?: string | null;

  // @IsOptional()
  // @IsBoolean()
  // emailPublic?: boolean;

  // @IsOptional()
  // @IsBoolean()
  // phoneNumberPublic?: boolean;
}
