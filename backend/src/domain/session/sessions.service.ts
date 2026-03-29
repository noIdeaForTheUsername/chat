import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SessionEntity } from "./entity/session.entity";
import { Not, Repository } from "typeorm";

@Injectable()
export class SessionsService {
  
  constructor(
    @InjectRepository(SessionEntity)
    private sessions: Repository<SessionEntity>,
  ) {}


  async destroyUserSessions(userId: number, excludeSessionId?: string) {
    return await this.sessions.delete({
      userId,
      sid: Not(excludeSessionId ?? "nonExistingSessionId")
    });
  }

}