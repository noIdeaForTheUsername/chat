import { Module } from "@nestjs/common";
import { AccountsDomainModule } from "src/domain/accounts/accounts.module";
import { AccountsModule } from "../accounts/accounts.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SessionsModule } from "src/domain/session/sessions.module";
import { ActionsThrottlerModule } from "src/application/shared/actions-rate-limiting/actions-throttler.module";
import { LoggingModule } from "src/shared/logging/logging.module";
import { AccountRateLimitsModule } from "../account-rate-limits/account-rate-limits.module";

@Module({
  imports: [AccountsDomainModule, AccountsModule, SessionsModule, ActionsThrottlerModule, LoggingModule, AccountRateLimitsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}