import { ConfigService } from "@nestjs/config";
import session from "express-session";

export function getSessionMiddleware(config: ConfigService) {
  return session({
    secret: config.get<string>('auth.secret') as any,
    resave: false,
    saveUninitialized: false,
    name: "session",
    cookie: {
      httpOnly: config.get<boolean>('cookies.httpOnly'),
      sameSite: config.get<string>('cookies.sameSite') as any,
      secure: config.get<boolean>('cookies.secure'),
      maxAge: config.get<number>('cookies.expire_ms'),
    }
  });
}