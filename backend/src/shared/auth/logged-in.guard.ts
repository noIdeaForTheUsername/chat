import { CanActivate, ExecutionContext, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import { ConfigService } from '@nestjs/config';

// This guard is used globally and endpoints that should be accessible without login should be marked with @PublicAccess()

@Injectable()
export class LoggedInGuard implements CanActivate {

  constructor(private jwtService: JwtService, private reflector: Reflector, private accounts: AccountsDomainService, private config: ConfigService) {}

  async canActivate(context: ExecutionContext) {
    const publicAccess = this.reflector.getAllAndOverride('publicAccess',
      [context.getHandler(), context.getClass()]) || false;

    const req = context.switchToHttp().getRequest();
    const jwt = this.extractTokenFromRequest(req, !publicAccess);

    // Extract and verify JWT
    try {
      const payload = await this.jwtService.verifyAsync(jwt, { secret: this.config.get<string>('jwt.secret') });
      req["userAuth"] = payload;
    }
    catch (e) {
      if (publicAccess) return true;  // token invalid, but route is public
      throw new UnauthorizedException('token-invalid');  // token invalid and route protected
    }

    // -- The below code will only be reached if the token is valid
    
    // Get the caller user from the database and verify if accounts exists and is active
    const account = await this.accounts.findExistingById(req["userAuth"].sub);
    if (!account.activated && !publicAccess) {
      throw new UnauthorizedException('account-inactive');
    }
    req["userAccount"] = account;

    return true;
  }

  private extractTokenFromRequest(req: Request, exceptionOnFail = true): string {
    const jwt = req.cookies?.['authJwt'];
    if (!jwt && exceptionOnFail) {
      console.log("Token missing");
      throw new UnauthorizedException('token-invalid');
    }
      
    return jwt;
  }
}
