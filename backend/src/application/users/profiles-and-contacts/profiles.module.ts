import { Module } from "@nestjs/common";
import { ProfilesController } from "./profiles.controller";
import { ProfilesDomainModule } from "src/domain/profiles/profiles.module";
import { ContactsDomainModule } from "src/domain/contacts/contacts.module";

@Module({
  controllers: [ProfilesController],
  imports: [ProfilesDomainModule, ContactsDomainModule]
})
export class ProfilesModule { }