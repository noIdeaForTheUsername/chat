import { Exclude } from 'class-transformer';

export class AccountResponseDto {
  id: number;
  phoneNumber: string;

  @Exclude()
  passwordHash: string;
}
