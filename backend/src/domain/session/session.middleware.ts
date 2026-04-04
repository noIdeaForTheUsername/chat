import { ConfigService } from "@nestjs/config";
import { RequestHandler } from "express";
import session from "express-session";
import { SessionEntity } from "src/domain/session/entity/session.entity";
import { TypeOrmSessionStore } from "src/domain/session/session-store";
import { DataSource } from "typeorm";

let sessionMiddleware: RequestHandler | null = null;


export async function initSessionMiddleware(config: ConfigService): Promise<RequestHandler> {

  const sessionDataSource = new DataSource({
    type: "postgres",
    host: config.get<string>('database.host'),
    port: config.get<number>('database.port'),
    username: config.get<string>('database.username'),
    password: config.get<string>('database.password'),
    database: config.get<string>('database.database'),
    schema: "public",
    entities: [
      SessionEntity
    ],
  });

  await sessionDataSource.initialize();

  if (!sessionMiddleware) {
    sessionMiddleware = session({
      store: new TypeOrmSessionStore(
        sessionDataSource.getRepository(SessionEntity),
        config,
      ),
      secret: config.getOrThrow<string>('auth.secret') as any,
      resave: false,
      saveUninitialized: false,
      name: 'session',
      cookie: {
        httpOnly: config.getOrThrow<boolean>('cookies.httpOnly'),
        sameSite: config.getOrThrow<string>('cookies.sameSite') as any,
        secure: config.getOrThrow<boolean>('cookies.secure'),
        maxAge: config.getOrThrow<number>('auth.absoluteExpiration') as any * 2,
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
