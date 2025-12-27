import { Controller, Get } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UserId } from '../../shared/auth/user-id.decorator';
import { AccountsService } from './accounts.service';
import { AccountResponseDto } from './dto/account-response.dto';

@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // REGISTER AND LOGIN MOVED TO USERS MODULE because it requires profile creation

  @Get("me")
  async getCurrentUser(@UserId() userId: number) {
    const account = await this.accountsService.findById(userId, true);
    return plainToInstance(AccountResponseDto, account);
  }
}
