import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SessionEntity } from "./entity/session.entity";
import { LessThan, Not, Repository } from "typeorm";

@Injectable()
export class SessionsService {
  
  constructor(
    @InjectRepository(SessionEntity)
    private sessions: Repository<SessionEntity>,
  ) {}

  // filters out expired
  async getUserSessions(userId: number) {
    return await this.sessions.findBy({
      userId,
      inactiveExpires: LessThan(new Date()),
      absolutelyExpires: LessThan(new Date()),
    });
  }

  async destroyUserSessions(userId: number, excludeSessionId?: string) {
    return await this.sessions.delete({
      userId,
      sid: Not(excludeSessionId ?? "nonExistingSessionId")
    });
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

}