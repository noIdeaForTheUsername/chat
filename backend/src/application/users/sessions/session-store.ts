import session from 'express-session';
import { Repository } from 'typeorm';
import { SessionEntity } from 'src/domain/session/entity/session.entity';
import { ConfigService } from '@nestjs/config';


export class TypeOrmSessionStore extends session.Store {
  constructor(
    public repo: Repository<SessionEntity>,
    public config: ConfigService,
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
      if (record.inactiveExpires.getTime() <= Date.now()
        || record.absolutelyExpires.getTime() <= Date.now()) {
        await this.repo.delete({ sid });
        return callback(null, null);
      }

      const sessionData: SessionEntity = {
        ...record,
      }

      callback(null, sessionData);
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, sessionData: Record<string, any>, callback: (err?: any) => void) {
    try {
      const inactiveExpires =
        sessionData.cookie?.expires ??
        new Date(Date.now() + this.config.get('auth.inactiveExpiration'));

      let absolutelyExpires = sessionData.absolutelyExpires;
      if (absolutelyExpires === undefined)
        absolutelyExpires = new Date(Date.now() + this.config.get('auth.absoluteExpiration'));

      await this.repo.save({
        ...sessionData,
        sid,
        inactiveExpires,
        absolutelyExpires,
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

  async touch(sid: string, sessionData: Record<string, any>, callback: (err?: any) => void) {
    try {
      const expires =
        new Date(Date.now() + this.config.get('auth.inactiveExpiration'));

      await this.repo.update(
        { sid },
        { inactiveExpires: expires },
      );

      callback();
    } catch (err) {
      callback(err);
    }
  }
}