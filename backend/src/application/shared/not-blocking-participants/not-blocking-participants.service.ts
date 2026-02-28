import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Contact } from "src/domain/contacts/entities/contact.entity";
import { Participation } from "src/domain/conversations/entities/participation.entity";
import { Repository } from "typeorm";

@Injectable()
export class NotBlockingParticipantsService {

  constructor(
    @InjectRepository(Participation)
    private readonly participationRepository: Repository<Participation>,
  ) {}
  
  // Returns a list of participant IDs in the specified conversation, without provided userId,
  // and without users who have blocked the provided userId.
  async getNotBlockingParticipantsIds(conversationId: number, userId: number) {
    const rows = await this.participationRepository
      .createQueryBuilder('p')
      .innerJoin(Contact, 'c', 'c.ownerId = p.userId AND c.participantId = :userId AND NOT c.blocked', { userId })
      .where('p.conversationId = :conversationId', { conversationId })
      .andWhere('p.userId != :userId', { userId })
      .select('p.userId', 'participantId')
      .getRawMany();
    return rows.map(row => Number(row.participantId));
  }
}