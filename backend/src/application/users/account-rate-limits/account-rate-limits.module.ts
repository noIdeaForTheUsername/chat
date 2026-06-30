import { Module } from "@nestjs/common";
import { AccountRateLimitsService } from "./account-rate-limits.service";
import { AccountsDomainModule } from "src/domain/accounts/accounts.module";
import { ActionsThrottlerModule } from "src/application/shared/actions-rate-limiting/actions-throttler.module";
import { LoggingModule } from "src/shared/logging/logging.module";
import { StringsModule } from "src/application/shared/strings/strings.module";

@Module({
  imports: [AccountsDomainModule, ActionsThrottlerModule, LoggingModule, StringsModule],
  providers: [AccountRateLimitsService],
  exports: [AccountRateLimitsService],
})
export class AccountRateLimitsModule {}