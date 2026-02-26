import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
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

@Injectable()
export class AccountsService {

  constructor(
    private accounts: AccountsDomainService,
    private profiles: ProfilesDomainService,
    private eventEmitter: EventEmitter2,
    private config: ConfigService
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
    if (!phoneNumber)
      throw new BadRequestException('phone-required');

    // Create and return ID
    try {
      const newAccount = await this.accounts.create(phoneNumber, passwordHash,
        !this.config.getOrThrow('auth.requireAccountActivation'));
      await this.profiles.createProfile(newAccount.id, name, bio);

      // Notify administrators
      this.notifyAdministration(
        ["accountCreatedHeader"],
        ["accountCreatedMessage", phoneNumber],
        "account-creation"
      );
      
      return newAccount;
    } catch (err) {
      this.handleFieldExistingError(err);
    }
  }

  @Transactional()
  async modifyAccount(callerId: number, dto: ModifyAccountDto) {
    const found = await this.accounts.findExistingById(callerId);
    await verifyPassword(found, dto.currentPassword);

    let toUpdate: Partial<Account> = {
      phoneNumber: dto.phoneNumber,
      passwordHash: undefined
    }

    if (dto.password) {
      let newPasswordHash = await hashPassword(dto.password);
      toUpdate.passwordHash = newPasswordHash;
    }

    try {
      await this.accounts.update(callerId, toUpdate);
    }
    catch (err) {
      this.handleFieldExistingError(err);
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
      this.eventEmitter.emit("pushNotification", event);
    }
  }

  async changeAccountAdminStatus(callerAccount: Account, callerPasswordConfirm: string,
    changedUserId: number, newIsAdmin: boolean) {
    if (callerAccount.id === changedUserId)
      throw new BadRequestException("cannot-change-own-admin-status");
    if (!await verifyPassword(callerAccount, callerPasswordConfirm)) {
      throw new ForbiddenException('credentials-invalid');
    }
    await this.accounts.changeAdminStatus(changedUserId, newIsAdmin);
  }

  private async notifyAdministration(messageHeader: string[], messageBody: string[], tag: string) {
    const admins = await this.accounts.findAdmins(true);
    for (const admin of admins) {
      const event: PushNotifcationEvent = {
        userId: admin.id,
        header: messageHeader,
        message: messageBody,
        tag: tag,
      };
      this.eventEmitter.emit("pushNotification", event);
    }
  }

  private handleFieldExistingError(err: any) {
    if (err instanceof QueryFailedError && err.driverError.code == "23505"){
      const constraint = err.driverError.constraint;
      switch (constraint) {
        // case 'unique_login':
        //   throw new ConflictException('exists.login');
        // case 'unique_email':
        //   throw new ConflictException('exists.email');
        case 'unique_phone_number':
          throw new ConflictException('exists.phone-number');
      }
    }
    throw err;
  }
}