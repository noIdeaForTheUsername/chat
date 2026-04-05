import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IncomingHttpHeaders } from "http";



@Injectable()
export class OriginFilterGuard implements CanActivate {

  private readonly allowedOrigins: string[];

  constructor(
    private readonly configService: ConfigService
  ) {
    this.allowedOrigins = this.configService.getOrThrow<string[]>("allowedOrigins");
    if (this.allowedOrigins.length === 0) {
      console.warn(`OriginFilterGuard: ALLOWED_ORIGINS is not set or empty in environment variables, so the guard is disabled.
        Even if the app only makes same-origin requests, set ALLOWED_ORIGINS in .env to enable origin filtering`);
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const headers: IncomingHttpHeaders = context.switchToHttp().getRequest().headers;
    const origin = headers.origin;

    // Allow undefined origin (browserless attackers are able to set this header easily anyways)
    if (this.allowedOrigins.length === 0 || origin === undefined)
      return true;

    if (origin && !this.allowedOrigins.includes(origin)) {
      throw new ForbiddenException("Origin not allowed");
    }

    return true;
  }
}