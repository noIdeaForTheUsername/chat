import { ConfigService } from "@nestjs/config";
import { RequestHandler } from "express";
import session from "express-session";
import pgSession from 'connect-pg-simple';
import config from "src/config";
import { Pool } from "pg";

let sessionMiddleware: RequestHandler | null = null;

const PgStore = pgSession(session);

export function initSessionMiddleware(config: ConfigService): RequestHandler {
  if (!sessionMiddleware) {
    sessionMiddleware = session({
      store: new PgStore({
        pool: new Pool({
          host: config.get('database.host'),
          port: config.get('database.port'),
          user: config.get('database.username'),
          password: config.get('database.password'),
          database: config.get('database.database'),
          max: 5,
        }),
        tableName: "device_sessions",
        createTableIfMissing: true,
        ttl: config.get<number>('cookies.expire_ms')
      }),
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
