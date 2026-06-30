import { HttpException, Injectable, UnauthorizedException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ActionsThrottlerService } from "src/application/shared/actions-rate-limiting/actions-throttler.service";
import { StringTemplate } from "src/application/shared/strings/string-params";
import { StringsService } from "src/application/shared/strings/strings.service";
import { AccountsDomainService } from "src/domain/accounts/accounts.service";
import { SessionEntity } from "src/domain/session/entity/session.entity";
import { PushNotifcationEvent } from "src/shared/events/push-notification.event";
import { LoggingService } from "src/shared/logging/app-logger";
import { Severity } from "src/shared/logging/logging-enums";
import { getSidHash } from "src/shared/sid-hash";
import { GLOBAL_BLOCKING_LOGIN_LIMIT_PER_ACCOUNT, GLOBAL_DELAYING_LOGIN_LIMIT_PER_ACCOUNT, LONG_LOGIN_LIMIT_PER_ACCOUNT, PASSWORD_PROTECTED_ACTION_LIMIT_PER_SESSION, SHORT_LOGIN_LIMIT_PER_ACCOUNT } from "./rate-limited-actions";


// Advanced rate limits for account- and auth-related actions, besides the standard @Throttle limits

@Injectable()
export class AccountRateLimitsService {
  
  constructor(
    private readonly accounts: AccountsDomainService,
    private readonly actionsThrottlerService: ActionsThrottlerService,
    private readonly logger: LoggingService,
    private readonly eventEmitter: EventEmitter2,
    private strings: StringsService
  ) {}


  async handleLoginRateLimits(phoneNumber: string, ip: string) {
    this.actionsThrottlerService.incrementAndThrow(SHORT_LOGIN_LIMIT_PER_ACCOUNT, `${phoneNumber};${ip}`);
    this.actionsThrottlerService.incrementAndThrow(LONG_LOGIN_LIMIT_PER_ACCOUNT, `${phoneNumber};${ip}`);
    
    const globalBlockStatus = this.actionsThrottlerService.incrementAndGetStatus(
      GLOBAL_BLOCKING_LOGIN_LIMIT_PER_ACCOUNT, phoneNumber);

    if (!globalBlockStatus.allowed) {
      // Security alert for administration
      if (globalBlockStatus.hits === GLOBAL_BLOCKING_LOGIN_LIMIT_PER_ACCOUNT.limit + 1) {
        this.logger.securityLog(
          `Global login limit hit for phone number ${phoneNumber} (Over ${globalBlockStatus.limit} attempts).`
          + ` All further attempts will be blocked until ${new Date(globalBlockStatus.expires ?? "(not specified)").toLocaleString()}`,
          Severity.HIGH,
          'AuthService'
        );

        this.notifyAdministration(
          { schema: "accountAttackHeader" },
          { schema: "accountAttackMessage: $", params: [phoneNumber] },
        );
      }

      throw new HttpException('Throttler Exception: Too Many Requests', 429);
    }

    const delayingLimit = !this.actionsThrottlerService.incrementAndGetReqAllowed(
      GLOBAL_DELAYING_LOGIN_LIMIT_PER_ACCOUNT, phoneNumber);
    if (delayingLimit) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 3000));
    }
  }

  resetLoginRateLimits(phoneNumber: string, ip: string) {
    this.actionsThrottlerService.resetLimit(SHORT_LOGIN_LIMIT_PER_ACCOUNT, `${phoneNumber};${ip}`);
    this.actionsThrottlerService.resetLimit(LONG_LOGIN_LIMIT_PER_ACCOUNT, `${phoneNumber};${ip}`);
    this.actionsThrottlerService.resetLimit(GLOBAL_BLOCKING_LOGIN_LIMIT_PER_ACCOUNT, phoneNumber);
    this.actionsThrottlerService.resetLimit(GLOBAL_DELAYING_LOGIN_LIMIT_PER_ACCOUNT, phoneNumber);
  }



  handlePasswordProtectedActionRateLimits(session: SessionEntity) {
    let tracker = session.sidHash ?? getSidHash(session.sid);
    if (session) {
      const rlStatus = this.actionsThrottlerService.incrementAndGetStatus(
        PASSWORD_PROTECTED_ACTION_LIMIT_PER_SESSION,
        tracker
      );
      // Logout the calling session if the limit is exceeded
      if (!rlStatus.allowed) {
        this.eventEmitter.emit('passwordProtectedActionLimitExceeded', { sidOrSidHash: tracker });
        throw new UnauthorizedException();
      }
    }
  }

  resetPasswordProtectedActionRateLimits(session: SessionEntity) {
    let tracker = session.sidHash ?? getSidHash(session.sid);
    this.actionsThrottlerService.resetLimit(PASSWORD_PROTECTED_ACTION_LIMIT_PER_SESSION, tracker);
  }

  private async notifyAdministration(messageHeader: string | StringTemplate, messageBody: string | StringTemplate, tag?: string) {
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
}