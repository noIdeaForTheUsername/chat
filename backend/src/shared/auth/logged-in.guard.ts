import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { jwtSecret } from 'src/application/users/auth/jwt-constants';

@Injectable()
export class LoggedInGuard implements CanActivate {

  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const publicAccess = this.reflector.getAllAndOverride('publicAccess',
      [context.getHandler(), context.getClass()]) || false;

    const req = context.switchToHttp().getRequest();
    const jwt = this.extractTokenFromRequest(req, !publicAccess);
    
    try {
      const payload = await this.jwtService.verifyAsync(jwt, { secret: jwtSecret });
      req["user"] = payload;
    }
    catch (e) {
      if (publicAccess) return true;
      throw new UnauthorizedException('token-invalid');
    }

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
