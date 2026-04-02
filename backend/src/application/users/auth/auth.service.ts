import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import { AccountsService } from '../accounts/accounts.service';
import { hashPassword, verifyPassword } from './auth-utils';
import { Request, Response } from 'express';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UserLogoutEvent } from 'src/shared/events/user-logout.event';
import { SessionsService } from 'src/domain/session/sessions.service';
import { UserGlobalLogoutEvent } from 'src/shared/events/user-global-logout.event';
import { RateLimitedAction } from 'src/application/actions-rate-limiting/rate-limited-action.interface';
import { ActionsThrottlerService } from 'src/application/actions-rate-limiting/actions-throttler.service';


// Advanced rate limits

const LOGIN_LIMIT_PER_ACCOUNT: RateLimitedAction = {
  name: 'ACCOUNT_LOGIN',
  limit: 10,
  ttl: 24 * 3600 * 1000,  // day
};
const ACCOUNT_CREATION_LIMIT: RateLimitedAction = {  // only successful creations count
  name: 'ACCOUNT_CREATION',
  limit: 50,
  ttl: 3 * 24 * 3600 * 1000, // 3 days
};


@Injectable()
export class AuthService {

  constructor(
    private accountsDomainService: AccountsDomainService,
    private accountsService: AccountsService,
    private actionsThrottlerService: ActionsThrottlerService,
    private eventEmitter: EventEmitter2,
    private sessionsService: SessionsService,
  ) { }
  

  // LOGIN & REGISTER

  async getCurrentUser(userId: number){
    return await this.accountsDomainService.findById(userId);
  }

  async login(req: any, phoneNumber: string, plainPassword: string):
  Promise<{ id: number /*userId*/, session: string }> {

    // find account
    const account = await this.accountsDomainService.findByPhoneNumber(phoneNumber);

    // rate limiting
    this.actionsThrottlerService.incrementAndThrow(LOGIN_LIMIT_PER_ACCOUNT, `${phoneNumber};${req.ip}`);

    // verification
    await verifyPassword(account, plainPassword);  // throws exception if invalid
    if (!account) {
      console.error(`AuthService: account is null after verifyPassword,
        but it should have thrown an exception in such case`);
      throw new ForbiddenException('credentials-invalid');
    }

    // session
    return await new Promise((resolve, reject) => {
      req.session.regenerate((err: any) => {
        if (err) return reject(err);
        req.session.userId = account.id;
        req.session.save((saveErr: any) => {
          if (saveErr) return reject(saveErr);
          resolve({
            id: account.id,
            session: req.session.id
          });
        });
      });
    });
  }

  async register(req: any, phoneNumber: string,
    plainPassword: string,
    name: string, bio?: string
  ): Promise<{ session: string }> {
    
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

    return await new Promise((resolve, reject) => {
      req.session.regenerate((err: any) => {
        if (err) return reject(err);
        req.session.userId = user.id;
        req.session.save((saveErr: any) => {
          if (saveErr) return reject(saveErr);
          resolve({
            session: req.session.id
          });
        });
      });
    });
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


  async globalLogout(userId: number, excludeSession?: string) {    
    await this.sessionsService.destroyUserSessions(userId, excludeSession);
    this.eventEmitter.emit('userLogout', new UserLogoutEvent(userId));
  }

  @OnEvent('userGlobalLogout')
  async globalLogoutEventHandler(event: UserGlobalLogoutEvent) {
    this.globalLogout(event.userId, event.excludeSession);
  }
}
