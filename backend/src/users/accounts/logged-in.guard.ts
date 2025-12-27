import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtSecret } from '../jwt-constants';
import { Reflector } from '@nestjs/core';

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
      throw new UnauthorizedException('Invalid authentication token');
    }

    return true;
  }

  private extractTokenFromRequest(req: Request, exceptionOnFail = true): string {
    const jwt = req.cookies?.['authJwt'];
    if (!jwt && exceptionOnFail)
      throw new UnauthorizedException('No authentication token provided');
    return jwt;
  }
}
