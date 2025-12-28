import { Controller, Get } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UserId } from 'src/shared/auth/user-id.decorator';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import { AccountResponseDto } from './dto/account-response.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsDomainService) {}

  @Get('me')
  async getCurrentUser(@UserId() userId: number) {
    const account = await this.accountsService.findAccountById(userId, true);
    return plainToInstance(AccountResponseDto, account);
  }
}
