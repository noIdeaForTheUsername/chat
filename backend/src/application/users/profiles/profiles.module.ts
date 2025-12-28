import { Module } from "@nestjs/common";
import { ProfilesController } from "./profiles.controller";
import { ProfilesDomainModule } from "src/domain/profiles/profiles.module";

@Module({
  controllers: [ProfilesController],
  imports: [ProfilesDomainModule]
})
export class ProfilesModule { }