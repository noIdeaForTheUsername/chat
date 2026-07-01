import { CanActivate, ExecutionContext, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';

// This guard is used globally (and only for HTTP requests); endpoints that should be accessible without login should be marked with @PublicAccess()

@Injectable()
export class LoggedInGuard implements CanActivate {

  constructor(private reflector: Reflector, private accounts: AccountsDomainService) {}

  async canActivate(context: ExecutionContext) {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse() as Response;

    const publicAccess = this.reflector.getAllAndOverride('publicAccess',
      [context.getHandler(), context.getClass()]) || false;

    if (!req.session.userId) {
      if (publicAccess)
        return true;
      else {
        if (req.cookies.session) {
          res.setHeader("Clear-Site-Data", "cache");  // sensitive data must be cleared on session expiration
          res.clearCookie('session');  // clear invalid cookie
        }
        throw new UnauthorizedException();
      }
    }
    
    // -- The below code will only be reached if the user is logged in (valid session)

    const allowInactiveAccount = this.reflector.getAllAndOverride<boolean>('allowInactiveAccount',
      [context.getHandler(), context.getClass()]) || false;
    
    // Get the caller user from the database and verify if accounts exists and is active
    const account = await this.accounts.findExistingById(req.session.userId);
    if (!account.activated && !publicAccess && !allowInactiveAccount) {
      throw new UnauthorizedException('account-inactive');
    }
    req["userAccount"] = account;

    return true;
  }
}
