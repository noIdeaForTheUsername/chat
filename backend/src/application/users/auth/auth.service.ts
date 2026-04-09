import { ForbiddenException, HttpException, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Request, Response } from 'express';
import { ActionsThrottlerService } from 'src/application/actions-rate-limiting/actions-throttler.service';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import { Account } from 'src/domain/accounts/entities/account.entity';
import { SessionsService } from 'src/domain/session/sessions.service';
import { PasswordChangeEvent } from 'src/shared/events/user-global-logout.event';
import { UserLogoutEvent } from 'src/shared/events/user-logout.event';
import { AccountsService } from '../accounts/accounts.service';
import { ACCOUNT_CREATION_LIMIT, GLOBAL_BLOCKING_LOGIN_LIMIT_PER_ACCOUNT, GLOBAL_DELAYING_LOGIN_LIMIT_PER_ACCOUNT, LONG_LOGIN_LIMIT_PER_ACCOUNT, SHORT_LOGIN_LIMIT_PER_ACCOUNT } from './auth-rate-limits';
import { hashPassword, verifyPassword } from './auth-utils';
import { LoggingService } from 'src/shared/logging/app-logger';
import { Severity } from 'src/shared/logging/logging-enums';



@Injectable()
export class AuthService {

  constructor(
    private accountsDomainService: AccountsDomainService,
    private accountsService: AccountsService,
    private actionsThrottlerService: ActionsThrottlerService,
    private eventEmitter: EventEmitter2,
    private sessionsService: SessionsService,
    private logger: LoggingService,
  ) { }
  

  // LOGIN & REGISTER

  async login(req: any, phoneNumber: string, plainPassword: string):
  Promise<{ userId: number, session: string }> {

    await this.handleLoginRateLimits(phoneNumber, req.ip);

    this.logger.securityLog(
      `Login attempt for phone number ${phoneNumber} from IP ${req.ip} and User-Agent ${req.headers['user-agent']}`,
      Severity.LOW,
      'AuthService'
    );

    // find account
    const account = await this.accountsDomainService.findByPhoneNumber(phoneNumber);

    // verification
    await verifyPassword(account, plainPassword);  // throws exception if invalid
    if (!account) {
      this.logger.error(`AuthService: account is null after verifyPassword,
        but it should have thrown an exception in such case`, null, 'AuthService');
      throw new ForbiddenException('credentials-invalid');
    }

    // -- After verification (login success):

    this.resetLoginRateLimits(phoneNumber, req.ip);

    return await this.createSession(account, req);
  }

  async register(req: any, phoneNumber: string,
    plainPassword: string,
    name: string, bio?: string
  ): Promise<{ userId: number, session: string }> {
    
    let user;

    // Creation with rate limiting for successful creations, and race condition prevention
    this.actionsThrottlerService.incrementAndThrow(ACCOUNT_CREATION_LIMIT, req.ip);
    try {
      const hashedPassword = await hashPassword(plainPassword);
      user = await this.accountsService.createUser(phoneNumber, hashedPassword, name, bio);
    }
    catch (err) {
      this.actionsThrottlerService.decrement(ACCOUNT_CREATION_LIMIT, req.ip);
      throw err;
    }

    return await this.createSession(user, req);
  }

  async logout(req: Request, res: Response) {
    const session: any = req.session;
    if (!session || !session.userId) {
      return res.clearCookie('session').send();
    }

    req.session.destroy(() => {
      this.eventEmitter.emit('userLogout', new UserLogoutEvent(session.userId));
      res.clearCookie('session').send();
    });
  }


  @OnEvent('passwordChangeEvent')
  async passwordChangeEventHandler(event: PasswordChangeEvent) {
    this.globalLogout(event.userId, event.sessionId);
  }
  
  async globalLogout(userId: number, excludeSession?: string) {    
    await this.sessionsService.destroyUserSessions(userId, excludeSession);
    this.eventEmitter.emit('userLogout', new UserLogoutEvent(userId));
  }


  // SESSIONS MANAGEMENT

  private async createSession(account: Account, req: any): Promise<{ userId: number, session: string }> {
    return await new Promise((resolve, reject) => {
      req.session.regenerate(async (err: any) => {
        if (err) return reject(err);
        await this.sessionsService.removeSessionsExceedingAccountLimit(account.id);
        req.session.userId = account.id;
        req.session.save((saveErr: any) => {
          if (saveErr) return reject(saveErr);
          resolve({
            userId: account.id,
            session: req.session.id
          });
        });
      });
    });
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON)
  private async cleanupExpiredSessions() {
    await this.sessionsService.cleanupExpiredSessions();
  }


  // CONDITIONAL RATE LIMITING

  private async handleLoginRateLimits(phoneNumber: string, ip: string) {
    this.actionsThrottlerService.incrementAndThrow(SHORT_LOGIN_LIMIT_PER_ACCOUNT, `${phoneNumber};${ip}`);
    this.actionsThrottlerService.incrementAndThrow(LONG_LOGIN_LIMIT_PER_ACCOUNT, `${phoneNumber};${ip}`);
    
    const globalBlockStatus = this.actionsThrottlerService.incrementAndGetStatus(
      GLOBAL_BLOCKING_LOGIN_LIMIT_PER_ACCOUNT, phoneNumber);

    if (!globalBlockStatus.allowed) {
      // Security alert for administration
      if (globalBlockStatus.hits === GLOBAL_BLOCKING_LOGIN_LIMIT_PER_ACCOUNT.limit + 1) {
        this.logger.securityLog(
          `Global login limit hit for phone number ${phoneNumber} (Over ${globalBlockStatus.limit} attempts).`
          + ` All further attempts will be blocked until ${new Date(globalBlockStatus.expires).toLocaleString()}`,
          Severity.HIGH,
          'AuthService'
        );

        this.accountsService.notifyAdministration(
          ["accountAttackHeader"],
          ["accountAttackMessage", phoneNumber],
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

  private async resetLoginRateLimits(phoneNumber: string, ip: string) {
    this.actionsThrottlerService.resetLimit(SHORT_LOGIN_LIMIT_PER_ACCOUNT, `${phoneNumber};${ip}`);
    this.actionsThrottlerService.resetLimit(LONG_LOGIN_LIMIT_PER_ACCOUNT, `${phoneNumber};${ip}`);
    this.actionsThrottlerService.resetLimit(GLOBAL_BLOCKING_LOGIN_LIMIT_PER_ACCOUNT, phoneNumber);
    this.actionsThrottlerService.resetLimit(GLOBAL_DELAYING_LOGIN_LIMIT_PER_ACCOUNT, phoneNumber);
  }
}
