import { ForbiddenException, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Request, Response } from 'express';
import { ActionsThrottlerService } from 'src/application/actions-rate-limiting/actions-throttler.service';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import { Account } from 'src/domain/accounts/entities/account.entity';
import { SessionsService } from 'src/domain/session/sessions.service';
import { PasswordProtectedActionLimitExceededEvent } from 'src/shared/events/password-action-limit-exceeded';
import { PasswordChangeEvent } from 'src/shared/events/user-global-logout.event';
import { UserLogoutEvent } from 'src/shared/events/user-logout.event';
import { LoggingService } from 'src/shared/logging/app-logger';
import { Severity } from 'src/shared/logging/logging-enums';
import {
  ACCOUNT_CREATION_LIMIT,
} from '../account-rate-limits/rate-limited-actions';
import { AccountsService } from '../accounts/accounts.service';
import { hashPassword, verifyPassword } from './auth-utils';
import { AccountRateLimitsService } from '../account-rate-limits/account-rate-limits.service';



@Injectable()
export class AuthService {

  constructor(
    private accountsDomainService: AccountsDomainService,
    private accountsService: AccountsService,
    private actionsThrottlerService: ActionsThrottlerService,
    private eventEmitter: EventEmitter2,
    private sessionsService: SessionsService,
    private logger: LoggingService,
    private rateLimits: AccountRateLimitsService,
  ) { }
  

  // LOGIN & REGISTER

  async login(req: any, phoneNumber: string, plainPassword: string):
  Promise<{ userId: number, session: string }> {

    await this.rateLimits.handleLoginRateLimits(phoneNumber, req.ip);

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
    if (account.admin) {
      this.logger.securityLog(
        `Successful login to administrator's account with phone number ${phoneNumber} from IP ${req.ip}`
        + ` and User-Agent ${req.headers['user-agent']}`,
        Severity.MEDIUM,
        'AuthService'
      );
    }

    // -- After verification (login success):
    this.rateLimits.resetLoginRateLimits(phoneNumber, req.ip);

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


  // LOGOUT

  async logout(req: Request, res: Response) {
    const session: any = req.session;
    if (!session || !session.userId) {
      return res.clearCookie('session').send();
    }

    return new Promise((resolve, reject) => {
      req.session.destroy(() => {
        this.eventEmitter.emit('userLogout', new UserLogoutEvent(session.userId));
        res.clearCookie('session').send();
        resolve(null);
      });
    });
  }

  async globalLogoutWithPasswordCheck(
    req: Request, password: string)
  {
    const session = req.session as any;
    const account: Account = (req as any).userAccount;
    this.rateLimits.handlePasswordProtectedActionRateLimits(session);

    await verifyPassword(account, password);
    await this.globalLogout(account.id, session?.sid);
    this.logger.securityLog(
      `Global logout performed for user ${account.id} from sidHash: ${session?.sidHash}`,
      Severity.MEDIUM,
      'AuthService'
    );
    this.rateLimits.resetPasswordProtectedActionRateLimits(session);
  }


  // OTHER


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


  @OnEvent("passwordProtectedActionLimitExceeded")
  private async destroySession(payload: PasswordProtectedActionLimitExceededEvent) {
    await this.sessionsService.destroySession(payload.sidOrSidHash);
  }
}
