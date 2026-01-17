import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import { AccountsService } from '../accounts/accounts.service';
import { hashPassword, verifyPassword } from './auth-utils';
import { Request, Response } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserLogoutEvent } from 'src/shared/events/user-logout.event';

@Injectable()
export class AuthService {

  constructor(
    private accountsDomainService: AccountsDomainService,
    private accountsService: AccountsService,
    private eventEmitter: EventEmitter2,
  ) { }
  

  // LOGIN & REGISTER

  async getCurrentUser(userId: number){
    return await this.accountsDomainService.findById(userId);
  }

  async login(req: any, account: string, plainPassword: string) {
    const found = await this.accountsDomainService.findByUniqueField(account);
    if (!found) throw new ForbiddenException('credentials-invalid');
    await verifyPassword(found, plainPassword);  // throws exception if invalid


    return await new Promise<number>((resolve, reject) => {
      req.session.regenerate((err: any) => {
        if (err) return reject(err);
        req.session.userId = found.id;
        req.session.save((saveErr: any) => {
          if (saveErr) return reject(saveErr);
          resolve(found.id);
        });
      });
    });
  }

  async register(req: any, login: string, plainPassword: string,
    emailPublic: boolean, phoneNumberPublic: boolean,
    email?: string, phoneNumber?: string,
    name?: string, bio?: string
  ) {
    const hashedPassword = await hashPassword(plainPassword);

    const user = await this.accountsService.createUser(login, hashedPassword, email, phoneNumber,
      emailPublic, phoneNumberPublic, name, bio);

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err: any) => {
        if (err) return reject(err);
        req.session.userId = user.id;
        req.session.save((saveErr: any) => {
          if (saveErr) return reject(saveErr);
          resolve();
        });
      });
    });
  }

  async logout(req: Request, res: Response) {
    const session: any = req.session;
    if (!session || !session.userId) {
      return res.clearCookie('session').send();
    }

    console.log("Logging out user ", (req.session as any).userId);
    req.session.destroy(() => {
      this.eventEmitter.emit('userLogout', new UserLogoutEvent(session.userId));
      res.clearCookie('session').send();
    });
  }
}
