import { IsString, IsOptional, MaxLength } from 'class-validator';
import { EmptyToNull } from 'src/shared/validation/empty-to-null';
import { NormalizeName } from 'src/shared/validation/normalize-name';

export class PatchProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @NormalizeName()
  name?: string;

  @EmptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;
}
