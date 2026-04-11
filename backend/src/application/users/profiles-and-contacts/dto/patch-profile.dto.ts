import { IsString, IsOptional, MaxLength } from 'class-validator';
import { EmptyToNull } from 'src/shared/validation/empty-to-null';

export class PatchProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  @EmptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;
}
