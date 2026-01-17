import { ConfigService } from "@nestjs/config";
import { RequestHandler } from "express";
import session from "express-session";
import pgSession from 'connect-pg-simple';
import config from "src/config";
import { Pool } from "pg";
import { TypeOrmSessionStore } from "src/domain/session/session-store";
import { DataSource } from "typeorm";
import { DeviceSessionEntity } from "src/domain/session/entity/device-session.entity";

let sessionMiddleware: RequestHandler | null = null;

const PgStore = pgSession(session);

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
      DeviceSessionEntity
    ],
  });

  await sessionDataSource.initialize();

  if (!sessionMiddleware) {
    sessionMiddleware = session({
      // store: new PgStore({
      //   pool: new Pool({
      //     host: config.get('database.host'),
      //     port: config.get('database.port'),
      //     user: config.get('database.username'),
      //     password: config.get('database.password'),
      //     database: config.get('database.database'),
      //     max: 5,
      //   }),
      //   tableName: "device_sessions",
      //   createTableIfMissing: true,
      //   ttl: config.get<number>('cookies.expireMs')
      // }),
      store: new TypeOrmSessionStore(
        sessionDataSource.getRepository(DeviceSessionEntity)
      ),
      secret: config.get<string>('auth.secret') as any,
      resave: false,
      saveUninitialized: false,
      name: 'session',
      cookie: {
        httpOnly: config.get<boolean>('cookies.httpOnly'),
        sameSite: config.get<string>('cookies.sameSite') as any,
        secure: config.get<boolean>('cookies.secure'),
        maxAge: config.get<number>('cookies.expireMs'),
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
