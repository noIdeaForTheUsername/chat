import { IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { EmptyToNull } from "src/shared/validation/empty-to-null";

export class PushSubscriptionDto {
  @IsString()
  endpoint: string;

  @IsOptional()
  @IsString()
  @EmptyToNull()
  expirationTime: number | null;

  @ValidateNested()
  keys: Keys;
}

class Keys {
  @IsString()
  p256dh: string;
  @IsString()
  auth: string;
}