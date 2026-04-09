import { CanActivate, ExecutionContext, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const account = context.switchToHttp().getRequest().userAccount;
    if (!account) {
      throw new InternalServerErrorException('AdminGuard: no userAccount in request - this guard should be called after the privilege check (such as login guard)');
    }
    return account.admin;
  }
}
