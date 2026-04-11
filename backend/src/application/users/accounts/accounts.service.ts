import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { Transactional } from "typeorm-transactional";
import { ModifyAccountDto } from "./dto/modify-account.dto";
import { AccountsDomainService } from "src/domain/accounts/accounts.service";
import { Account } from "src/domain/accounts/entities/account.entity";
import { QueryFailedError } from "typeorm";
import { ProfilesDomainService } from "src/domain/profiles/profiles.service";
import { hashPassword, verifyPassword } from "../auth/auth-utils";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PushNotifcationEvent } from "src/shared/events/push-notification.event";
import { ConfigService } from "@nestjs/config";
import { PasswordChangeEvent } from "src/shared/events/user-global-logout.event";
import { SessionEntity } from "src/domain/session/entity/session.entity";
import { LoggingService } from "src/shared/logging/app-logger";
import { Severity } from "src/shared/logging/logging-enums";
import { AccountRateLimitsService } from "../account-rate-limits/account-rate-limits.service";

@Injectable()
export class AccountsService {

  constructor(
    private accounts: AccountsDomainService,
    private profiles: ProfilesDomainService,
    private eventEmitter: EventEmitter2,
    private config: ConfigService,
    private logger: LoggingService,
    private accountRateLimiter: AccountRateLimitsService,
  ) {}

  // GETTERS

  async getAccount(userId: number) {
    return await this.accounts.findById(userId);
  }

  async getUnactivatedAccounts() {
    return await this.accounts.findUnactivatedAccounts();
  }

  // BASIC ACCOUNT MODIFICATIONS

  @Transactional()
  async createUser(phoneNumber: string, passwordHash: string,
    name: string, bio?: string,
  ) {
    // Create and return ID
    try {
      const newAccount = await this.accounts.create(phoneNumber, passwordHash,
        !this.config.getOrThrow('auth.requireAccountActivation'));
      await this.profiles.createProfile(newAccount.id, name, bio);

      // Notify administrators
      const admins = await this.accounts.findAdmins(true);
      for (const admin of admins) {
        const event: PushNotifcationEvent = {
          userId: admin.id,
          header: ["accountCreatedHeader"],
          message: ["accountCreatedMessage", phoneNumber],
          tag: "account-creation",
        };
        this.eventEmitter.emit("pushNotification", event);
      }

      return newAccount;

    } catch (err) {
      this.handleFieldExistingError(err);
      throw err; // to make TS happy (handleFieldExistingError should throw an exception ALWAYS anyways)
    }
  }

  async modifyAccount(account: Account, session: SessionEntity, dto: ModifyAccountDto) {
    this.accountRateLimiter.handlePasswordProtectedActionRateLimits(session);
    await verifyPassword(account, dto.currentPassword);

    let toUpdate: Partial<Account> = {
      phoneNumber: dto.phoneNumber,
      passwordHash: undefined
    }

    if (dto.password) {
      let newPasswordHash = await hashPassword(dto.password);
      toUpdate.passwordHash = newPasswordHash;
      this.eventEmitter.emit("passwordChangeEvent", new PasswordChangeEvent(account.id, session.sid));
    }

    try {
      await this.accounts.update(account.id, toUpdate);
      if (account.admin) {
        this.logger.securityLog(
          `Administrator id=${account.id} has changed their account data from sessionIdHash: ${session.sidHash}`,
          Severity.HIGH, "AccountsService");
      }
      else {
        this.logger.securityLog(
          `User id=${account.id} has changed their account data from sessionIdHash: ${session.sidHash}`,
          Severity.MEDIUM, "AccountsService");
      }
    }
    catch (err) {
      this.handleFieldExistingError(err);
      throw err;
    }
    finally {
      // If this try-catch block was reached then the password was correct
      this.accountRateLimiter.resetPasswordProtectedActionRateLimits(session);
    }
  }

  // ACCOUNT PRIVILEGES OPERATIONS

  async changeAccountActivationStatus(callerAdminId: number, changedUserId: number, activated: boolean) {
    if (callerAdminId === changedUserId)
      throw new BadRequestException("cannot-change-own-activation-status");
    await this.accounts.changeActivationStatus(changedUserId, activated);

    if (activated) {
      const event: PushNotifcationEvent = {
        userId: changedUserId,
        header: ["accountActivatedHeader"],
        message: ["accountActivatedMessage"],
        tag: "account-activation",
        // clickUrl: "/chats"
      };
      this.logger.securityLog(
        `Admin id=${callerAdminId} has activated account id=${changedUserId}`,
        Severity.MEDIUM, "AccountsService");
      this.eventEmitter.emit("pushNotification", event);
    }
  }

  async changeAccountAdminStatus(callerAccount: Account, callerSession: SessionEntity, callerPasswordConfirm: string,
    changedUserId: number, newIsAdmin: boolean) {

    this.accountRateLimiter.handlePasswordProtectedActionRateLimits(callerSession);

    if (callerAccount.id === changedUserId)
      throw new BadRequestException("cannot-change-own-admin-status");
    if (!await verifyPassword(callerAccount, callerPasswordConfirm)) {
      throw new ForbiddenException('credentials-invalid');
    }

    await this.accounts.changeAdminStatus(changedUserId, newIsAdmin);

    this.accountRateLimiter.resetPasswordProtectedActionRateLimits(callerSession);
    this.logger.securityLog(
      `User id=${callerAccount.id} has changed admin status for account id=${changedUserId} to ${newIsAdmin ? 'true' : 'false'}`,
      Severity.CRITICAL, "AccountsService");
  }

  async changeAccountPassword(callerAccount: Account, callerSession: SessionEntity, callerPasswordConfirm: string,
    changedUserId: number, newPassword: string) {

    this.accountRateLimiter.handlePasswordProtectedActionRateLimits(callerSession);

    const verified = await verifyPassword(callerAccount, callerPasswordConfirm);
    if (!verified) throw new ForbiddenException('credentials-invalid');

    const newPasswordHash = await hashPassword(newPassword);
    await this.accounts.changePassword(changedUserId, newPasswordHash);

    this.accountRateLimiter.resetPasswordProtectedActionRateLimits(callerSession);
    this.eventEmitter.emit("passwordChangeEvent", new PasswordChangeEvent(changedUserId, undefined));
    this.logger.securityLog(
      `User id=${callerAccount.id} has changed password for account id=${changedUserId}`,
      Severity.MEDIUM, "AccountsService");
  }

  private handleFieldExistingError(err: any) {
    if (err instanceof QueryFailedError && err.driverError.code == "23505"){
      const constraint = err.driverError.constraint;
      switch (constraint) {
        case 'unique_phone_number':
          throw new ConflictException('exists.phone-number');
      }
    }
    throw err;
  }
}