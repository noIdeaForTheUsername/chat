import { Module } from "@nestjs/common";
import { ProfilesController } from "./profiles.controller";
import { ProfilesDomainModule } from "src/domain/profiles/profiles.module";
import { ContactsDomainModule } from "src/domain/contacts/contacts.module";

// This module connects profiles and contacts together, because Contacts are just how
// the user sees other Profiles and frontend doesn't even know about Contacts.

@Module({
  controllers: [ProfilesController],
  imports: [ProfilesDomainModule, ContactsDomainModule]
})
export class ProfilesModule { }