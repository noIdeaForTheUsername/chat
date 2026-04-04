import { Module } from "@nestjs/common";
import { AccountsDomainModule } from "src/domain/accounts/accounts.module";
import { ProfilesDomainModule } from "src/domain/profiles/profiles.module";
import { ConfigService } from "@nestjs/config";
import { AccountsService } from "./accounts.service";
import { AccountsController } from "./accounts.controller";

@Module({
  imports: [
    AccountsDomainModule,
    ProfilesDomainModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {
  constructor(private config: ConfigService) {}
}