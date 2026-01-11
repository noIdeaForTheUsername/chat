import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, ParseBoolPipe, ParseIntPipe, Patch, UseGuards } from "@nestjs/common";
import { PublicAccess } from "src/shared/auth/public-access.decorator";
import { UserId } from "src/shared/auth/user-id.decorator";
import { AccountResponseDto } from "./dto/account-response.dto";
import { plainToInstance } from "class-transformer";
import { ModifyAccountDto } from "./dto/modify-account.dto";
import { AccountsService } from "./accounts.service";
import { AdminGuard } from "src/shared/auth/admin.guard";
import { Account } from "src/domain/accounts/entities/account.entity";
import { SetAdminStatusDto } from "./dto/set-admin.dto";
import { UserAccount } from "src/shared/auth/account.decorator";

// User account creation in auth module

@Controller("accounts")
export class AccountsController {

  constructor(private readonly accountsService: AccountsService) {}

  @Get('me')
  async getCurrentUser(@UserId() userId: number) {
    const unsafe = await this.accountsService.getAccount(userId);
    return plainToInstance(AccountResponseDto, unsafe)
  }

  // ACCOUNT BASIC MODIFICATIONS

  @Patch("me")
  @HttpCode(HttpStatus.OK)
  async modifyAccount(@UserId() userId: number, @Body() body: ModifyAccountDto): Promise<AccountResponseDto> {
    if (body.password !== body.passwordRepeat)
      throw new BadRequestException("passwords-different");

    if (!body.email) body.email = null;
    if (!body.phoneNumber) body.phoneNumber = null;

    return plainToInstance(
      AccountResponseDto,
      await this.accountsService.modifyAccount(userId, body)
    );
  }

  // ACCOUNT STATUS AND PRIVILEGES OPERATIONS

  @UseGuards(AdminGuard)
  @Get("unactivated")
  async getUnactivatedAccounts() {
    const unsafe = (await this.accountsService.getUnactivatedAccounts()).map(acc =>
      plainToInstance(AccountResponseDto, acc)
    );
    return unsafe;
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

  @UseGuards(AdminGuard)
  @Patch(":id/admin")
  async changeAccountAdminStatus(
    @UserAccount() adminAccount: Account,
    @Body() body: SetAdminStatusDto, 
    @Body('id', ParseIntPipe) userId: number)
  {
    await this.accountsService.changeAccountAdminStatus(adminAccount, body.password, userId, body.isAdmin);
  }
}