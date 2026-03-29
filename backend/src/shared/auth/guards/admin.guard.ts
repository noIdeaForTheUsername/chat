import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const account = context.switchToHttp().getRequest().userAccount;
    if (!account) {
      console.error('AdminGuard: no userAccount in request - this guard should be called after the privilege check (such as login guard)');
      return false;
    }
    return account.admin;
  }
}
