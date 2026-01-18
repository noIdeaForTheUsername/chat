import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { EmptyToNull } from "src/shared/validation/empty-to-null";


export class PushSubscriptionDto {
  @IsObject()
  subscription: object;

  @IsString()
  language: string;
}
