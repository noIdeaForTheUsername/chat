import session from 'express-session';
import { Repository } from 'typeorm';
import { DeviceSessionEntity } from './entity/device-session.entity';
import { InjectRepository } from '@nestjs/typeorm';

export class TypeOrmSessionStore extends session.Store {
  constructor(
    public repo: Repository<DeviceSessionEntity>
  ) {
    super();
  }

  async get(sid: string, callback: (err: any, session?: any) => void) {
    try {
      // get record
      const record = await this.repo.findOneBy({ sid });
      if (!record) {
        return callback(null, null);
      }

      // expire check
      if (record.expires.getTime() <= Date.now()) {
        await this.repo.delete({ sid });
        return callback(null, null);
      }

      const sessionData: DeviceSessionEntity = {
        sid: record.sid,
        userId: record.userId,
        expires: record.expires,
        cookie: record.cookie,
        pushSubscription: record.pushSubscription,
        fcmToken: record.fcmToken,
        language: record.language,
      }

      callback(null, sessionData);
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, sessionData: any, callback: (err?: any) => void) {
    try {
      const expires =
        sessionData.cookie?.expires ??
        new Date(Date.now() + sessionData.cookie.maxAge);

      await this.repo.save({
        sid,
        userId: sessionData.userId,
        pushSubscription: sessionData.pushSubscription,
        cookie: sessionData.cookie,
        language: sessionData.language,
        fcmToken: sessionData.fcmToken,
        expires,
      });

      callback();
    } catch (err) {
      callback(err);
    }
  }

  async destroy(sid: string, callback: (err?: any) => void) {
    try {
      await this.repo.delete({ sid });
      callback();
    } catch (err) {
      callback(err);
    }
  }

  async touch(sid: string, sessionData: any, callback: (err?: any) => void) {
    try {
      const expires =
        sessionData.cookie?.expires ??
        new Date(Date.now() + sessionData.cookie.maxAge);

      await this.repo.update(
        { sid },
        { expires },
      );

      callback();
    } catch (err) {
      callback(err);
    }
  }
}