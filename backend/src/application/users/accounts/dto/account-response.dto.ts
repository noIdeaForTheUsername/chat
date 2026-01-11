import { Exclude } from 'class-transformer';

export class AccountResponseDto {
  id: number;
  login: string;
  email?: string;
  phoneNumber?: string;

  @Exclude()
  passwordHash: string;
}
