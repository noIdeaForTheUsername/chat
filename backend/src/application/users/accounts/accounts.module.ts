import { Module } from "@nestjs/common";
import { AccountsDomainModule } from "src/domain/accounts/accounts.module";
import { ProfilesDomainModule } from "src/domain/profiles/profiles.module";
import { AccountsService } from "./accounts.service";
import { AccountsController } from "./accounts.controller";
import { LoggingModule } from "src/shared/logging/logging.module";
import { AccountRateLimitsModule } from "../account-rate-limits/account-rate-limits.module";

@Module({
  imports: [
    AccountsDomainModule,
    ProfilesDomainModule,
    LoggingModule,
    AccountRateLimitsModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}