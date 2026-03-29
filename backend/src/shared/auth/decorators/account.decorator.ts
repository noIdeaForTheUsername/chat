import { createParamDecorator, ExecutionContext, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { Account } from 'src/domain/accounts/entities/account.entity';

export const UserAccount = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const account = ctx.switchToHttp().getRequest().userAccount;
    if (!account) {
      console.error('UserAccount decorator: no userAccount in request - this decorator should be used after the privilege check (login guard)');
      throw new InternalServerErrorException();
    }
    return account as Account;
  },
);