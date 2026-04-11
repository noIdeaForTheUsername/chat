import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SessionEntity } from "./entity/session.entity";
import { LessThan, MoreThan, Not, Repository } from "typeorm";


@Injectable()
export class SessionsService {

  private readonly MAX_SESSIONS_PER_ACCOUNT = 10;
  
  constructor(
    @InjectRepository(SessionEntity)
    private sessions: Repository<SessionEntity>,
  ) {}

  // filters out expired
  async getUserSessions(userId: number) {
    return await this.sessions.findBy({
      userId,
      inactiveExpires: MoreThan(new Date()),
      absolutelyExpires: MoreThan(new Date()),
    });
  }

  async destroyUserSessions(userId: number, excludeSessionId?: string) {
    return await this.sessions.delete({
      userId,
      sid: Not(excludeSessionId ?? "nonExistingSessionId")
    });
  }

  async destroySession(sidOrSidHash: string) {
    const result = await this.sessions.delete([
      { sid: sidOrSidHash },
      { sidHash: sidOrSidHash }
    ]);
  }

  async removeWebPushSubscription(sessionId: string) {
    return await this.sessions.update(
      { sid: sessionId },
      { pushSubscription: null });
  }

  async removeFcmToken(sessionId: string) {
    return await this.sessions.update(
      { sid: sessionId },
      { fcmToken: null });
  }
  
  async removeSessionsExceedingAccountLimit(userId: number) {
    await this.sessions.query(`
      DELETE FROM sessions
      WHERE sid IN (
        SELECT sid FROM sessions
        WHERE user_id = $1
        ORDER BY absolutely_expires DESC
        OFFSET $2
      )
    `, [userId, this.MAX_SESSIONS_PER_ACCOUNT - 1]);
  }

  async cleanupExpiredSessions() {
    const now = new Date();
    await this.sessions.delete([
      { inactiveExpires: LessThan(now) },
      { absolutelyExpires: LessThan(now) }
    ]);
  }
}