import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Contact } from "src/domain/contacts/entities/contact.entity";
import { Participation } from "src/domain/conversations/entities/participation.entity";
import { NotBlockingParticipantsService } from "./not-blocking-participants.service";

@Module({
  imports: [TypeOrmModule.forFeature([Participation, Contact])],
  providers: [NotBlockingParticipantsService],
  exports: [NotBlockingParticipantsService],
})
export class NotBlockingParticipantsModule {}