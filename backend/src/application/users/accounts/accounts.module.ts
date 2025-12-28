import { Module } from "@nestjs/common";
import { AccountsController } from "./accounts.controller";
import { AccountsDomainModule } from "src/domain/accounts/accounts.module";

@Module({
  controllers: [AccountsController],
  imports: [AccountsDomainModule],
})
export class AccountsModule { }