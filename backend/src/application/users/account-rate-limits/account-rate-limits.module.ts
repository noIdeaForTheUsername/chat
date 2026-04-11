import { Module } from "@nestjs/common";
import { AccountRateLimitsService } from "./account-rate-limits.service";
import { AccountsDomainModule } from "src/domain/accounts/accounts.module";
import { ActionsThrottlerModule } from "src/application/actions-rate-limiting/actions-throttler.module";
import { LoggingModule } from "src/shared/logging/logging.module";

@Module({
  imports: [AccountsDomainModule, ActionsThrottlerModule, LoggingModule],
  providers: [AccountRateLimitsService],
  exports: [AccountRateLimitsService],
})
export class AccountRateLimitsModule {}