import { ConfigService } from "@nestjs/config";
import { RequestHandler } from "express";
import session from "express-session";
import config from "src/config";

let sessionMiddleware: RequestHandler | null = null;

export function initSessionMiddleware(config: ConfigService): RequestHandler {
  if (!sessionMiddleware) {
    sessionMiddleware = session({
      secret: config.get<string>('auth.secret') as any,
      resave: false,
      saveUninitialized: false,
      name: 'session',
      cookie: {
        httpOnly: config.get<boolean>('cookies.httpOnly'),
        sameSite: config.get<string>('cookies.sameSite') as any,
        secure: config.get<boolean>('cookies.secure'),
        maxAge: config.get<number>('cookies.expire_ms'),
      },
    });
  }
  return sessionMiddleware;
}

export function getSessionMiddleware(): RequestHandler {
  if (!sessionMiddleware) {
    throw new Error('Session middleware not initialized. Call initSessionMiddleware() in main.ts first.');
  }
  return sessionMiddleware;
}