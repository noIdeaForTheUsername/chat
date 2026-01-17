import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { EmptyToNull } from "src/shared/validation/empty-to-null";

class Keys {
  @IsString()
  p256dh: string;
  @IsString()
  auth: string;
}

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
