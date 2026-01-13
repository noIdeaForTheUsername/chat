import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import { AccountsService } from '../accounts/accounts.service';
import { hashPassword, verifyPassword } from './auth-utils';

@Injectable()
export class AuthService {

  constructor(
    private accountsDomainService: AccountsDomainService,
    private accountsService: AccountsService,
    private jwtService: JwtService
  ) { }
  

  // LOGIN & REGISTER

  async getCurrentUser(userId: number){
    return await this.accountsDomainService.findById(userId);
  }

  async login(account: string, plainPassword: string) {
    const found = await this.accountsDomainService.findByUniqueField(account);
    if (!found) throw new UnauthorizedException('credentials-invalid');
    await verifyPassword(found, plainPassword);

    return { sub: found.id, authJwt: await this.jwtService.signAsync({ sub: found.id }) };
  }

  async register(login: string, plainPassword: string,
    emailPublic: boolean, phoneNumberPublic: boolean,
    email?: string, phoneNumber?: string,
    name?: string, bio?: string
  ) {
    const hashedPassword = await hashPassword(plainPassword);

    const id = await this.accountsService.createUser(login, hashedPassword, email, phoneNumber,
      emailPublic, phoneNumberPublic, name, bio);

    return { authJwt: await this.jwtService.signAsync({ sub: id }) }
  }
}
