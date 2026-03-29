import { IsString, IsOptional, MaxLength } from 'class-validator';
import { EmptyToNull } from 'src/shared/validation/empty-to-null';

export class PatchProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @EmptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string | null;
}
