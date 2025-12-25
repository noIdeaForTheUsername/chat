import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtSecret } from '../jwt-constants';

@Injectable()
export class LoggedIn implements CanActivate {

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const jwt = this.extractTokenFromRequest(req);
    
    try {
      const payload = await this.jwtService.verifyAsync(jwt, { secret: jwtSecret });
      req["user"] = payload;
    }
    catch (e) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return true;
  }

  private extractTokenFromRequest(req: Request): string {
    const jwt = req.cookies?.['authJwt'];
    if (!jwt) throw new UnauthorizedException('No authentication token provided');
    return jwt;
  }
}
