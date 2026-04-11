import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, ParseBoolPipe, ParseIntPipe, Patch, Session, UseGuards } from "@nestjs/common";
import { PublicAccess } from "src/shared/auth/decorators/public-access.decorator";
import { UserId } from "src/shared/auth/decorators/user-id.decorator";
import { AccountResponseDto } from "./dto/account-response.dto";
import { plainToInstance } from "class-transformer";
import { ModifyAccountDto } from "./dto/modify-account.dto";
import { AccountsService } from "./accounts.service";
import { AdminGuard } from "src/shared/auth/guards/admin.guard";
import { Account } from "src/domain/accounts/entities/account.entity";
import { SetAdminStatusDto } from "./dto/set-admin.dto";
import { UserAccount } from "src/shared/auth/decorators/account.decorator";
import { SessionEntity } from "src/domain/session/entity/session.entity";
import { ChangePasswordDto } from "./dto/admin-change-password.dto";
import { Throttle } from "@nestjs/throttler";
import { SENSITIVE_RATE_LIMIT } from "src/shared/global-rate-limiting/rate-limiting-settings";

// User account creation in auth module
// The accounts controller handles actions related to account data modifications
// while the auth controller handles login, logout, registration and GET /me

@Controller("accounts")
@Throttle(SENSITIVE_RATE_LIMIT)
export class AccountsController {

  constructor(private readonly accountsService: AccountsService) {}

  // ACCOUNT BASIC MODIFICATIONS

  @Patch("me")
  @HttpCode(HttpStatus.OK)
  async modifyAccount(
    @UserAccount() account: Account,
    @Session() session: SessionEntity,
    @Body() body: ModifyAccountDto): Promise<AccountResponseDto> {
    if (body.password !== body.passwordRepeat)
      throw new BadRequestException("passwords-different");

    return plainToInstance(
      AccountResponseDto,
      await this.accountsService.modifyAccount(account, session, body)
    );
  }

  // ACCOUNT STATUS AND PRIVILEGES OPERATIONS

  @UseGuards(AdminGuard)
  @Get("unactivated")
  async getUnactivatedAccounts() {
    return (await this.accountsService.getUnactivatedAccounts()).map(acc =>
      plainToInstance(AccountResponseDto, acc)
    );
  }


  @UseGuards(AdminGuard)
  @Patch(":id/activated")
  async changeAccountActivationStatus(
    @UserId() adminId: number,
    @Body('activated', ParseBoolPipe) activated: boolean,
    @Param('id', ParseIntPipe) userId: number)
  {
    await this.accountsService.changeAccountActivationStatus(adminId, userId, activated);
  }

  @Patch(":id/password")
  @UseGuards(AdminGuard)
  async changeAccountPassword(
    @UserAccount() adminAccount: Account,
    @Session() adminSession: SessionEntity,
    @Body() body: ChangePasswordDto,
    @Param('id', ParseIntPipe) userId: number
  ) {
    await this.accountsService.changeAccountPassword(adminAccount, adminSession, body.adminPassword, userId, body.newPassword);
  }


  @UseGuards(AdminGuard)
  @Patch(":id/admin")
  async changeAccountAdminStatus(
    @UserAccount() adminAccount: Account,
    @Session() adminSession: SessionEntity,
    @Body() body: SetAdminStatusDto, 
    @Param('id', ParseIntPipe) userId: number)
  {
    await this.accountsService.changeAccountAdminStatus(adminAccount, adminSession, body.password, userId, body.isAdmin);
  }
}