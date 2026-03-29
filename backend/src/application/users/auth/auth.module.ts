import { Module } from "@nestjs/common";
import { AccountsDomainModule } from "src/domain/accounts/accounts.module";
import { AccountsModule } from "../accounts/accounts.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SessionsModule } from "src/domain/session/sessions.module";

@Module({
  imports: [AccountsDomainModule, AccountsModule, SessionsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}